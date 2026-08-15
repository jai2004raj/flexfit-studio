import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { Database } from "@/db";
import { users, memberships, membershipPlans, bookings, type User } from "@/db/schema";
import type {
  MemberProfile,
  MemberSearchResult,
  MemberWithHistory,
} from "@/shared/types/member.types";
import type {
  UpdateProfileInput,
  SearchMembersInput,
} from "@/shared/schemas/member.schema";
import type { UserRole } from "@/shared/types/common.types";

export class MemberService {
  static async getProfile(
    db: Database,
    user: User,
  ): Promise<MemberProfile> {
    const membership = await db
      .select({
        id: memberships.id,
        status: memberships.status,
        startDate: memberships.startDate,
        endDate: memberships.endDate,
        creditsRemaining: memberships.creditsRemaining,
        planName: membershipPlans.name,
        planCredits: membershipPlans.classCredits,
      })
      .from(memberships)
      .innerJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
      .where(eq(memberships.userId, user.id))
      .orderBy(desc(memberships.endDate))
      .get();

    const [{ attended }] = await db
      .select({ attended: sql<number>`count(*)` })
      .from(bookings)
      .where(
        and(eq(bookings.userId, user.id), eq(bookings.status, "attended")),
      );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      membership: membership ?? null,
      classesAttended: Number(attended),
    };
  }

  static async updateProfile(
    db: Database,
    userId: number,
    input: UpdateProfileInput,
  ): Promise<User> {
    const updated = await db
      .update(users)
      .set(input)
      .where(eq(users.id, userId))
      .returning()
      .get();

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    }

    return updated;
  }

  static async searchMembers(
    db: Database,
    input: Partial<SearchMembersInput> = {},
  ): Promise<MemberSearchResult[]> {
    const term = `%${(input.q ?? "").trim()}%`;
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        active: users.active,
      })
      .from(users)
      .where(
        input.q?.trim()
          ? or(like(users.name, term), like(users.email, term))
          : undefined,
      )
      .limit(input.limit ?? 50);
  }

  static async getMemberById(
    db: Database,
    id: number,
  ): Promise<MemberWithHistory> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .get();

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
    }

    const history = await db
      .select({
        id: memberships.id,
        planName: membershipPlans.name,
        startDate: memberships.startDate,
        endDate: memberships.endDate,
        status: memberships.status,
        creditsRemaining: memberships.creditsRemaining,
      })
      .from(memberships)
      .innerJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
      .where(eq(memberships.userId, user.id))
      .orderBy(desc(memberships.startDate));

    const { passwordHash: _omit, ...safe } = user;
    return { ...safe, memberships: history };
  }

  static async setMemberActive(
    db: Database,
    id: number,
    active: boolean,
  ): Promise<User> {
    const updated = await db
      .update(users)
      .set({ active })
      .where(eq(users.id, id))
      .returning()
      .get();

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
    }

    return updated;
  }

  static async setMemberRole(
    db: Database,
    id: number,
    role: UserRole,
  ): Promise<User> {
    const updated = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning()
      .get();

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
    }

    return updated;
  }

  static async lookupByEmailOrPhone(
    db: Database,
    query: string,
  ): Promise<MemberSearchResult> {
    const term = `%${query.trim()}%`;
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        active: users.active,
      })
      .from(users)
      .where(
        or(
          like(users.email, term),
          like(users.phone, term),
        ),
      )
      .get();

    if (!user || user.role !== "member") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
    }

    return user;
  }
}
