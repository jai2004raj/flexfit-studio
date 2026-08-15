import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { Database } from "@/db";
import { classes, bookings, users, type GymClass } from "@/db/schema";
import type {
  ClassListItem,
  ClassWithRoster,
} from "@/shared/types/class.types";
import type {
  ListClassesInput,
  CreateClassInput,
  UpdateClassInput,
} from "@/shared/schemas/class.schema";

export class ClassService {
  static async listClasses(
    db: Database,
    input: Partial<ListClassesInput> = {},
  ): Promise<ClassListItem[]> {
    const filters = [];
    if (input.from) filters.push(gte(classes.startsAt, input.from));
    if (input.to) filters.push(lte(classes.startsAt, input.to));
    if (!input.includeCancelled) filters.push(eq(classes.cancelled, false));

    const rows = await db
      .select({
        id: classes.id,
        name: classes.name,
        description: classes.description,
        room: classes.room,
        capacity: classes.capacity,
        startsAt: classes.startsAt,
        durationMin: classes.durationMin,
        creditCost: classes.creditCost,
        cancelled: classes.cancelled,
        trainerName: users.name,
        booked: sql<number>`(
          select count(*) from ${bookings}
          where ${bookings.classId} = ${classes.id}
            and ${bookings.status} = 'booked'
        )`.as("booked"),
      })
      .from(classes)
      .leftJoin(users, eq(classes.trainerId, users.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(classes.startsAt));

    return rows.map((r) => ({
      ...r,
      spotsLeft: Math.max(0, r.capacity - Number(r.booked)),
      full: Number(r.booked) >= r.capacity,
    }));
  }

  static async getClassById(
    db: Database,
    classId: number,
  ): Promise<ClassWithRoster> {
    const cls = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .get();

    if (!cls) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
    }

    const roster = await db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
        memberName: users.name,
        memberEmail: users.email,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.classId, cls.id));

    return { ...cls, roster };
  }

  static async createClass(
    db: Database,
    input: CreateClassInput,
  ): Promise<GymClass> {
    return db
      .insert(classes)
      .values({
        ...input,
        description: input.description ?? null,
        trainerId: input.trainerId ?? null,
      })
      .returning()
      .get();
  }

  static async updateClass(
    db: Database,
    input: UpdateClassInput,
  ): Promise<GymClass> {
    const { id, ...patch } = input;
    const updated = await db
      .update(classes)
      .set(patch)
      .where(eq(classes.id, id))
      .returning()
      .get();

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
    }
    return updated;
  }

  static async cancelClass(
    db: Database,
    classId: number,
  ): Promise<GymClass> {
    const cls = await db
      .update(classes)
      .set({ cancelled: true })
      .where(eq(classes.id, classId))
      .returning()
      .get();

    if (!cls) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
    }

    await db
      .update(bookings)
      .set({ status: "cancelled", cancelledAt: new Date().toISOString() })
      .where(
        and(eq(bookings.classId, classId), eq(bookings.status, "booked")),
      );

    return cls;
  }
}
