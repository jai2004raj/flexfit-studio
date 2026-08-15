import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDatabase } from "../helpers/test-db";
import { BookingService } from "@/server/services/booking.service";
import { RescheduleService } from "@/server/services/reschedule.service";
import { users, membershipPlans, memberships, classes, bookings } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("RescheduleService", () => {
  let testEnv: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testEnv = await createTestDatabase();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  it("validates and reschedules booking to another class with the same name", async () => {
    const { db } = testEnv;

    const user = await db
      .insert(users)
      .values({ name: "User", email: "u@test.com", passwordHash: "h", role: "member" })
      .returning()
      .get();

    const plan = await db
      .insert(membershipPlans)
      .values({ name: "Plan", priceCents: 100, durationDays: 30, classCredits: 5 })
      .returning()
      .get();

    await db.insert(memberships).values({
      userId: user.id,
      planId: plan.id,
      startDate: "2020-01-01",
      endDate: "2099-12-31",
      creditsRemaining: 5,
      status: "active",
    });

    const classTime1 = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString();
    const classTime2 = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString();

    const class1 = await db
      .insert(classes)
      .values({ name: "Vinyasa Yoga", room: "Studio A", capacity: 10, startsAt: classTime1, creditCost: 1 })
      .returning()
      .get();

    const class2 = await db
      .insert(classes)
      .values({ name: "Vinyasa Yoga", room: "Studio A", capacity: 10, startsAt: classTime2, creditCost: 1 })
      .returning()
      .get();

    const originalBooking = await BookingService.bookClass(db, user.id, class1.id);

    // Validate reschedule
    const validation = await RescheduleService.validateReschedule(db, user.id, originalBooking.id, class2.id);
    expect(validation.valid).toBe(true);

    // Perform reschedule
    const result = await RescheduleService.rescheduleBooking(db, user.id, originalBooking.id, class2.id);
    expect(result.ok).toBe(true);
    expect(result.newStatus).toBe("booked");

    // Old booking is cancelled
    const oldB = await db.select().from(bookings).where(eq(bookings.id, originalBooking.id)).get();
    expect(oldB?.status).toBe("cancelled");
  });

  it("rejects rescheduling to a class with a different name", async () => {
    const { db } = testEnv;

    const user = await db
      .insert(users)
      .values({ name: "User", email: "u@test.com", passwordHash: "h", role: "member" })
      .returning()
      .get();

    const plan = await db
      .insert(membershipPlans)
      .values({ name: "Plan", priceCents: 100, durationDays: 30, classCredits: 5 })
      .returning()
      .get();

    await db.insert(memberships).values({
      userId: user.id,
      planId: plan.id,
      startDate: "2020-01-01",
      endDate: "2099-12-31",
      creditsRemaining: 5,
      status: "active",
    });

    const classTime1 = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString();
    const classTime2 = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString();

    const class1 = await db
      .insert(classes)
      .values({ name: "Yoga", room: "Studio A", capacity: 10, startsAt: classTime1, creditCost: 1 })
      .returning()
      .get();

    const class2 = await db
      .insert(classes)
      .values({ name: "Spin", room: "Spin Room", capacity: 10, startsAt: classTime2, creditCost: 1 })
      .returning()
      .get();

    const originalBooking = await BookingService.bookClass(db, user.id, class1.id);

    const validation = await RescheduleService.validateReschedule(db, user.id, originalBooking.id, class2.id);
    expect(validation.valid).toBe(false);
  });
});
