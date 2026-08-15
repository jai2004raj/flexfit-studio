import { and, eq, gte } from "drizzle-orm";
import type { Database } from "@/db";
import { classes, trainerAvailability, type TrainerAvailability } from "@/db/schema";
import { isDateTimeOverlapping } from "@/lib/date";
import type {
  TrainerUpcomingClass,
  TrainerAvailabilityCheckResult,
} from "@/shared/types/trainer.types";
import type {
  SetTrainerAvailabilityInput,
  CheckTrainerAvailabilityInput,
} from "@/shared/schemas/trainer.schema";

export class TrainerService {
  static async getUpcomingClasses(
    db: Database,
    trainerId: number,
  ): Promise<TrainerUpcomingClass[]> {
    const now = new Date().toISOString();

    return db
      .select({
        id: classes.id,
        name: classes.name,
        room: classes.room,
        startsAt: classes.startsAt,
        durationMin: classes.durationMin,
        cancelled: classes.cancelled,
      })
      .from(classes)
      .where(
        and(
          eq(classes.trainerId, trainerId),
          gte(classes.startsAt, now),
          eq(classes.cancelled, false),
        ),
      )
      .orderBy(classes.startsAt);
  }

  static async getAvailability(
    db: Database,
    trainerId: number,
  ): Promise<TrainerAvailability[]> {
    return db
      .select()
      .from(trainerAvailability)
      .where(eq(trainerAvailability.trainerId, trainerId))
      .orderBy(trainerAvailability.dayOfWeek);
  }

  static async setAvailability(
    db: Database,
    trainerId: number,
    input: SetTrainerAvailabilityInput,
  ): Promise<TrainerAvailability> {
    const existing = await db
      .select()
      .from(trainerAvailability)
      .where(
        and(
          eq(trainerAvailability.trainerId, trainerId),
          eq(trainerAvailability.dayOfWeek, input.dayOfWeek),
        ),
      )
      .get();

    if (existing) {
      return db
        .update(trainerAvailability)
        .set({
          startTime: input.startTime,
          endTime: input.endTime,
        })
        .where(eq(trainerAvailability.id, existing.id))
        .returning()
        .get();
    } else {
      return db
        .insert(trainerAvailability)
        .values({
          trainerId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
        })
        .returning()
        .get();
    }
  }

  static async removeAvailability(
    db: Database,
    trainerId: number,
    dayOfWeek: number,
  ): Promise<{ success: boolean }> {
    const existing = await db
      .select()
      .from(trainerAvailability)
      .where(
        and(
          eq(trainerAvailability.trainerId, trainerId),
          eq(trainerAvailability.dayOfWeek, dayOfWeek),
        ),
      )
      .get();

    if (existing) {
      await db
        .delete(trainerAvailability)
        .where(eq(trainerAvailability.id, existing.id));
    }

    return { success: true };
  }

  static async checkAvailability(
    db: Database,
    input: CheckTrainerAvailabilityInput,
  ): Promise<TrainerAvailabilityCheckResult> {
    const classStart = new Date(input.startsAt);
    const classEnd = new Date(classStart.getTime() + input.durationMin * 60000);

    const dayOfWeek = classStart.getUTCDay();
    const startTimeStr =
      String(classStart.getUTCHours()).padStart(2, "0") +
      ":" +
      String(classStart.getUTCMinutes()).padStart(2, "0");
    const endTimeStr =
      String(classEnd.getUTCHours()).padStart(2, "0") +
      ":" +
      String(classEnd.getUTCMinutes()).padStart(2, "0");

    const availability = await db
      .select()
      .from(trainerAvailability)
      .where(
        and(
          eq(trainerAvailability.trainerId, input.trainerId),
          eq(trainerAvailability.dayOfWeek, dayOfWeek),
        ),
      )
      .get();

    if (!availability) {
      return { available: false, reason: "No availability set for this day" };
    }

    const availStart = availability.startTime;
    const availEnd = availability.endTime;

    const isWithinAvailability =
      startTimeStr >= availStart && endTimeStr <= availEnd;

    if (!isWithinAvailability) {
      return { available: false, reason: "Outside availability hours" };
    }

    const conflictingClasses = await db
      .select()
      .from(classes)
      .where(
        and(
          eq(classes.trainerId, input.trainerId),
          eq(classes.cancelled, false),
        ),
      );

    for (const cls of conflictingClasses) {
      const existStart = new Date(cls.startsAt);
      const existEnd = new Date(
        existStart.getTime() + cls.durationMin * 60000,
      );

      if (isDateTimeOverlapping(classStart, classEnd, existStart, existEnd)) {
        return { available: false, reason: "Trainer already has a class at this time" };
      }
    }

    return { available: true };
  }
}
