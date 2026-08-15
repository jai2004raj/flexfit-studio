import { and, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { Database } from "@/db";
import { reschedules, bookings, classes } from "@/db/schema";
import { hoursUntil } from "@/lib/date";
import { FREE_RESCHEDULE_HOURS } from "@/config/constants";
import type {
  RescheduleResult,
  RescheduleHistoryItem,
  RescheduleValidationResult,
} from "@/shared/types/reschedule.types";

export class RescheduleService {
  static async validateReschedule(
    db: Database,
    userId: number,
    fromBookingId: number,
    toClassId: number,
  ): Promise<RescheduleValidationResult> {
    const originalRow = await db
      .select({
        booking: bookings,
        cls: classes,
      })
      .from(bookings)
      .innerJoin(classes, eq(bookings.classId, classes.id))
      .where(eq(bookings.id, fromBookingId))
      .get();

    if (!originalRow) {
      return { valid: false, reason: "Booking not found." };
    }

    const { booking: originalBooking, cls: originalClass } = originalRow;

    if (originalBooking.userId !== userId) {
      return { valid: false, reason: "You cannot reschedule this booking." };
    }

    if (
      originalBooking.status !== "booked" &&
      originalBooking.status !== "waitlisted"
    ) {
      return { valid: false, reason: "This booking is no longer active." };
    }

    const hoursBeforeOriginal = hoursUntil(originalClass.startsAt);
    if (hoursBeforeOriginal < FREE_RESCHEDULE_HOURS) {
      return {
        valid: false,
        reason: `You can only reschedule up to ${FREE_RESCHEDULE_HOURS} hours before the class starts.`,
      };
    }

    const targetClass = await db
      .select()
      .from(classes)
      .where(eq(classes.id, toClassId))
      .get();

    if (!targetClass) {
      return { valid: false, reason: "Target class not found." };
    }

    if (targetClass.name !== originalClass.name) {
      return {
        valid: false,
        reason: "You can only reschedule to a class with the same name.",
      };
    }

    if (targetClass.id === originalClass.id) {
      return {
        valid: false,
        reason: "You are already booked for this class.",
      };
    }

    if (hoursUntil(targetClass.startsAt) <= 0) {
      return {
        valid: false,
        reason: "This class has already started.",
      };
    }

    if (targetClass.cancelled) {
      return {
        valid: false,
        reason: "This class has been cancelled.",
      };
    }

    const existingBooking = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.classId, targetClass.id),
          eq(bookings.userId, userId),
          sql`${bookings.status} in ('booked', 'waitlisted')`,
        ),
      )
      .get();

    if (existingBooking) {
      return {
        valid: false,
        reason: "You already have an active booking for this class.",
      };
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(
        and(eq(bookings.classId, targetClass.id), eq(bookings.status, "booked")),
      );

    const targetIsFull = Number(count) >= targetClass.capacity;

    return { valid: true, targetIsFull };
  }

  static async rescheduleBooking(
    db: Database,
    userId: number,
    fromBookingId: number,
    toClassId: number,
  ): Promise<RescheduleResult> {
    const originalRow = await db
      .select({
        booking: bookings,
        cls: classes,
      })
      .from(bookings)
      .innerJoin(classes, eq(bookings.classId, classes.id))
      .where(eq(bookings.id, fromBookingId))
      .get();

    if (!originalRow) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
    }

    const { booking: originalBooking, cls: originalClass } = originalRow;

    if (originalBooking.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot reschedule this booking.",
      });
    }

    if (
      originalBooking.status !== "booked" &&
      originalBooking.status !== "waitlisted"
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This booking is no longer active.",
      });
    }

    const hoursBeforeOriginal = hoursUntil(originalClass.startsAt);
    if (hoursBeforeOriginal < FREE_RESCHEDULE_HOURS) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `You can only reschedule up to ${FREE_RESCHEDULE_HOURS} hours before the class starts.`,
      });
    }

    const targetClass = await db
      .select()
      .from(classes)
      .where(eq(classes.id, toClassId))
      .get();

    if (!targetClass) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Target class not found.",
      });
    }

    if (targetClass.name !== originalClass.name) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You can only reschedule to a class with the same name.",
      });
    }

    if (targetClass.id === originalClass.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You are already booked for this class.",
      });
    }

    if (hoursUntil(targetClass.startsAt) <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This class has already started.",
      });
    }

    if (targetClass.cancelled) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This class has been cancelled.",
      });
    }

    const existingBooking = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.classId, targetClass.id),
          eq(bookings.userId, userId),
          sql`${bookings.status} in ('booked', 'waitlisted')`,
        ),
      )
      .get();

    if (existingBooking) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "You already have an active booking for this class.",
      });
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(
        and(eq(bookings.classId, targetClass.id), eq(bookings.status, "booked")),
      );

    const targetIsFull = Number(count) >= targetClass.capacity;

    const newBooking = await db
      .insert(bookings)
      .values({
        classId: targetClass.id,
        userId,
        membershipId: originalBooking.membershipId,
        status: targetIsFull ? "waitlisted" : "booked",
        creditsUsed: originalBooking.creditsUsed,
      })
      .returning()
      .get();

    await db
      .update(bookings)
      .set({
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      })
      .where(eq(bookings.id, originalBooking.id));

    await db.insert(reschedules).values({
      userId,
      fromBookingId: originalBooking.id,
      toBookingId: newBooking.id,
      fromClassId: originalClass.id,
      toClassId: targetClass.id,
    });

    return {
      ok: true,
      newBooking,
      newStatus: targetIsFull ? "waitlisted" : "booked",
    };
  }

  static async getRescheduleHistory(
    db: Database,
    userId: number,
  ): Promise<RescheduleHistoryItem[]> {
    return db
      .select({
        id: reschedules.id,
        rescheduledAt: reschedules.rescheduledAt,
        fromClassName: classes.name,
        fromClassTime: sql<string>`(
          SELECT ${classes.startsAt} FROM ${classes}
          WHERE ${classes.id} = ${reschedules.fromClassId}
        )`,
        fromClassRoom: sql<string>`(
          SELECT ${classes.room} FROM ${classes}
          WHERE ${classes.id} = ${reschedules.fromClassId}
        )`,
        toClassName: sql<string>`(
          SELECT ${classes.name} FROM ${classes}
          WHERE ${classes.id} = ${reschedules.toClassId}
        )`,
        toClassTime: sql<string>`(
          SELECT ${classes.startsAt} FROM ${classes}
          WHERE ${classes.id} = ${reschedules.toClassId}
        )`,
        toClassRoom: sql<string>`(
          SELECT ${classes.room} FROM ${classes}
          WHERE ${classes.id} = ${reschedules.toClassId}
        )`,
      })
      .from(reschedules)
      .innerJoin(classes, eq(reschedules.fromClassId, classes.id))
      .where(eq(reschedules.userId, userId))
      .orderBy(desc(reschedules.rescheduledAt));
  }
}
