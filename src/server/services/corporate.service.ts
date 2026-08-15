import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { Database } from "@/db";
import {
  corporateBookings,
  classes,
  companies,
  companyMembers,
  checkins,
  users,
  type CorporateBooking,
  type Company,
} from "@/db/schema";
import { hoursUntil } from "@/lib/date";
import { CORPORATE_FREE_CANCELLATION_HOURS } from "@/config/constants";
import type {
  CorporateMemberBookingItem,
  CorporateRosterEntry,
  CompanyWithDetails,
} from "@/shared/types/corporate.types";
import type { CheckinSource, UserRole } from "@/shared/types/common.types";
import type { CreateCompanyInput } from "@/shared/schemas/corporate.schema";

export class CorporateService {
  static async getCompanyForMember(db: Database, userId: number) {
    return db
      .select()
      .from(companyMembers)
      .innerJoin(companies, eq(companyMembers.companyId, companies.id))
      .where(
        and(
          eq(companyMembers.userId, userId),
          eq(companies.active, true),
        ),
      )
      .get();
  }

  static async getMyCorporateBookings(
    db: Database,
    userId: number,
    includePast = false,
  ): Promise<CorporateMemberBookingItem[]> {
    const rows = await db
      .select({
        id: corporateBookings.id,
        status: corporateBookings.status,
        creditsUsed: corporateBookings.creditsUsed,
        bookedAt: corporateBookings.bookedAt,
        classId: classes.id,
        className: classes.name,
        room: classes.room,
        startsAt: classes.startsAt,
        durationMin: classes.durationMin,
        cancelled: classes.cancelled,
        companyName: companies.name,
      })
      .from(corporateBookings)
      .innerJoin(classes, eq(corporateBookings.classId, classes.id))
      .innerJoin(companies, eq(corporateBookings.companyId, companies.id))
      .where(eq(corporateBookings.userId, userId))
      .orderBy(asc(classes.startsAt));

    const now = new Date();
    return rows.filter((r) =>
      includePast ? true : new Date(r.startsAt) >= now,
    );
  }

  static async bookCorporateClass(
    db: Database,
    userId: number,
    classId: number,
  ): Promise<CorporateBooking> {
    const cls = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .get();

    if (!cls) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
    }
    if (cls.cancelled) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This class has been cancelled.",
      });
    }
    if (hoursUntil(cls.startsAt) <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This class has already started.",
      });
    }

    const existing = await db
      .select()
      .from(corporateBookings)
      .where(
        and(
          eq(corporateBookings.classId, cls.id),
          eq(corporateBookings.userId, userId),
          inArray(corporateBookings.status, ["booked", "waitlisted"]),
        ),
      )
      .get();

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "You are already on the list for this class.",
      });
    }

    const companyRow = await this.getCompanyForMember(db, userId);
    if (!companyRow) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not linked to an active company.",
      });
    }

    const company = companyRow.companies;
    if (company.creditPoolBalance < cls.creditCost) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Your company does not have enough credits.",
      });
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(corporateBookings)
      .where(
        and(
          eq(corporateBookings.classId, cls.id),
          eq(corporateBookings.status, "booked"),
        ),
      );

    const isFull = Number(count) >= cls.capacity;

    const created = await db
      .insert(corporateBookings)
      .values({
        classId: cls.id,
        userId,
        companyId: company.id,
        status: isFull ? "waitlisted" : "booked",
        creditsUsed: isFull ? 0 : cls.creditCost,
      })
      .returning()
      .get();

    if (!isFull) {
      await db
        .update(companies)
        .set({
          creditPoolBalance: company.creditPoolBalance - cls.creditCost,
        })
        .where(eq(companies.id, company.id));
    }

    return created;
  }

  static async cancelCorporateBooking(
    db: Database,
    user: { id: number; role: UserRole },
    bookingId: number,
  ): Promise<{ ok: boolean; refunded: boolean }> {
    const row = await db
      .select({ booking: corporateBookings, cls: classes })
      .from(corporateBookings)
      .innerJoin(classes, eq(corporateBookings.classId, classes.id))
      .where(eq(corporateBookings.id, bookingId))
      .get();

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
    }

    const isOwner = row.booking.userId === user.id;
    const isStaff = user.role === "admin" || user.role === "trainer";
    if (!isOwner && !isStaff) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot cancel this booking.",
      });
    }

    if (row.booking.status !== "booked" && row.booking.status !== "waitlisted") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This booking is no longer active.",
      });
    }

    const refundable =
      hoursUntil(row.cls.startsAt) >= CORPORATE_FREE_CANCELLATION_HOURS &&
      row.booking.creditsUsed > 0;

    await db
      .update(corporateBookings)
      .set({ status: "cancelled", cancelledAt: new Date().toISOString() })
      .where(eq(corporateBookings.id, row.booking.id));

    if (refundable) {
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, row.booking.companyId))
        .get();

      if (company) {
        await db
          .update(companies)
          .set({
            creditPoolBalance: company.creditPoolBalance + row.booking.creditsUsed,
          })
          .where(eq(companies.id, company.id));
      }
    }

    // Freeing a confirmed spot promotes the member who has waited longest.
    if (row.booking.status === "booked") {
      const next = await db
        .select()
        .from(corporateBookings)
        .where(
          and(
            eq(corporateBookings.classId, row.cls.id),
            eq(corporateBookings.status, "waitlisted"),
          ),
        )
        .orderBy(asc(corporateBookings.bookedAt))
        .get();

      if (next) {
        await db
          .update(corporateBookings)
          .set({ status: "booked", creditsUsed: row.cls.creditCost })
          .where(eq(corporateBookings.id, next.id));

        const company = await db
          .select()
          .from(companies)
          .where(eq(companies.id, next.companyId))
          .get();

        if (company && company.creditPoolBalance >= row.cls.creditCost) {
          await db
            .update(companies)
            .set({
              creditPoolBalance: Math.max(
                0,
                company.creditPoolBalance - row.cls.creditCost,
              ),
            })
            .where(eq(companies.id, company.id));
        }
      }
    }

    return { ok: true, refunded: refundable };
  }

  static async markCorporateAttended(
    db: Database,
    bookingId: number,
    _source: CheckinSource = "front_desk",
  ): Promise<{ ok: boolean }> {
    const booking = await db
      .select()
      .from(corporateBookings)
      .where(eq(corporateBookings.id, bookingId))
      .get();

    if (!booking) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
    }
    if (booking.status !== "booked") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only confirmed bookings can be checked in.",
      });
    }

    await db
      .update(corporateBookings)
      .set({ status: "attended" })
      .where(eq(corporateBookings.id, booking.id));

    await db.insert(checkins).values({
      userId: booking.userId,
      bookingId: null,
    });

    return { ok: true };
  }

  static async getCorporateRosterForClass(
    db: Database,
    classId: number,
  ): Promise<CorporateRosterEntry[]> {
    return db
      .select({
        bookingId: corporateBookings.id,
        status: corporateBookings.status,
        memberId: users.id,
        memberName: users.name,
        memberEmail: users.email,
        bookedAt: corporateBookings.bookedAt,
        companyName: companies.name,
      })
      .from(corporateBookings)
      .innerJoin(users, eq(corporateBookings.userId, users.id))
      .innerJoin(companies, eq(corporateBookings.companyId, companies.id))
      .where(eq(corporateBookings.classId, classId))
      .orderBy(asc(corporateBookings.bookedAt));
  }

  static async listCompanies(db: Database) {
    return db
      .select({
        id: companies.id,
        name: companies.name,
        contactEmail: companies.contactEmail,
        creditPoolBalance: companies.creditPoolBalance,
        active: companies.active,
        createdAt: companies.createdAt,
      })
      .from(companies)
      .orderBy(desc(companies.createdAt));
  }

  static async getCompanyById(
    db: Database,
    companyId: number,
  ): Promise<CompanyWithDetails> {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .get();

    if (!company) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Company not found." });
    }

    const members = await db
      .select({
        id: users.id,
        companyMemberId: companyMembers.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
      .from(companyMembers)
      .innerJoin(users, eq(companyMembers.userId, users.id))
      .where(eq(companyMembers.companyId, company.id))
      .orderBy(users.name);

    const recentBookings = await db
      .select({
        id: corporateBookings.id,
        status: corporateBookings.status,
        creditsUsed: corporateBookings.creditsUsed,
        bookedAt: corporateBookings.bookedAt,
        className: classes.name,
        startsAt: classes.startsAt,
        memberName: users.name,
      })
      .from(corporateBookings)
      .innerJoin(classes, eq(corporateBookings.classId, classes.id))
      .innerJoin(users, eq(corporateBookings.userId, users.id))
      .where(eq(corporateBookings.companyId, company.id))
      .orderBy(desc(corporateBookings.bookedAt))
      .limit(20);

    return {
      ...company,
      members,
      recentBookings,
    };
  }

  static async createCompany(
    db: Database,
    input: CreateCompanyInput,
  ): Promise<Company> {
    return db
      .insert(companies)
      .values({
        name: input.name,
        contactEmail: input.contactEmail,
        creditPoolBalance: input.creditPoolBalance,
        active: true,
      })
      .returning()
      .get();
  }

  static async updateCompanyActive(
    db: Database,
    companyId: number,
    active: boolean,
  ): Promise<Company> {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .get();

    if (!company) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Company not found." });
    }

    return db
      .update(companies)
      .set({ active })
      .where(eq(companies.id, companyId))
      .returning()
      .get();
  }

  static async topUpCompanyCredits(
    db: Database,
    companyId: number,
    amount: number,
  ): Promise<Company> {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .get();

    if (!company) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Company not found." });
    }

    return db
      .update(companies)
      .set({
        creditPoolBalance: company.creditPoolBalance + amount,
      })
      .where(eq(companies.id, companyId))
      .returning()
      .get();
  }

  static async linkCompanyMember(
    db: Database,
    companyId: number,
    userId: number,
  ) {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .get();

    if (!company) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Company not found." });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    }

    if (user.role !== "member") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only members can be linked to companies.",
      });
    }

    const existing = await db
      .select()
      .from(companyMembers)
      .where(
        and(
          eq(companyMembers.userId, userId),
          eq(companyMembers.companyId, companyId),
        ),
      )
      .get();

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This member is already linked to this company.",
      });
    }

    return db
      .insert(companyMembers)
      .values({
        userId,
        companyId,
      })
      .returning()
      .get();
  }

  static async unlinkCompanyMember(
    db: Database,
    companyMemberId: number,
  ): Promise<{ ok: boolean }> {
    const companyMember = await db
      .select()
      .from(companyMembers)
      .where(eq(companyMembers.id, companyMemberId))
      .get();

    if (!companyMember) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Company member link not found.",
      });
    }

    await db
      .delete(companyMembers)
      .where(eq(companyMembers.id, companyMemberId));

    return { ok: true };
  }
}
