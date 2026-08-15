import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDatabase } from "../helpers/test-db";
import { BookingService } from "@/server/services/booking.service";
import { users, membershipPlans, memberships, classes, bookings } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { eq } from "drizzle-orm";

describe("BookingService", () => {
  let testEnv: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testEnv = await createTestDatabase();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  it("successfully books a class and deducts credit when capacity is available", async () => {
    const { db } = testEnv;

    // Create user
    const user = await db
      .insert(users)
      .values({
        name: "Test Member",
        email: "member@test.com",
        passwordHash: hashPassword("pass"),
        role: "member",
      })
      .returning()
      .get();

    // Create plan
    const plan = await db
      .insert(membershipPlans)
      .values({
        name: "10 Pack",
        priceCents: 5000,
        durationDays: 30,
        classCredits: 10,
      })
      .returning()
      .get();

    // Create membership with 5 credits
    const membership = await db
      .insert(memberships)
      .values({
        userId: user.id,
        planId: plan.id,
        startDate: "2020-01-01",
        endDate: "2099-12-31",
        creditsRemaining: 5,
        status: "active",
      })
      .returning()
      .get();

    // Create class starting tomorrow
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const gymClass = await db
      .insert(classes)
      .values({
        name: "Morning Yoga",
        room: "Studio A",
        capacity: 10,
        startsAt: futureDate,
        creditCost: 1,
      })
      .returning()
      .get();

    // Book class
    const booking = await BookingService.bookClass(db, user.id, gymClass.id);

    expect(booking.status).toBe("booked");
    expect(booking.creditsUsed).toBe(1);

    // Verify membership credits decremented
    const updatedMembership = await db
      .select()
      .from(memberships)
      .where(eq(memberships.id, membership.id))
      .get();
    expect(updatedMembership?.creditsRemaining).toBe(4);
  });

  it("places user on waitlist with 0 credits used when class is full", async () => {
    const { db } = testEnv;

    const user1 = await db
      .insert(users)
      .values({ name: "User 1", email: "u1@test.com", passwordHash: "h", role: "member" })
      .returning()
      .get();

    const user2 = await db
      .insert(users)
      .values({ name: "User 2", email: "u2@test.com", passwordHash: "h", role: "member" })
      .returning()
      .get();

    const plan = await db
      .insert(membershipPlans)
      .values({ name: "Plan", priceCents: 100, durationDays: 30, classCredits: 5 })
      .returning()
      .get();

    await db.insert(memberships).values([
      { userId: user1.id, planId: plan.id, startDate: "2020-01-01", endDate: "2099-12-31", creditsRemaining: 5, status: "active" },
      { userId: user2.id, planId: plan.id, startDate: "2020-01-01", endDate: "2099-12-31", creditsRemaining: 5, status: "active" },
    ]);

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const gymClass = await db
      .insert(classes)
      .values({ name: "Spin", room: "Spin Room", capacity: 1, startsAt: futureDate, creditCost: 1 })
      .returning()
      .get();

    // User 1 books the only spot
    const b1 = await BookingService.bookClass(db, user1.id, gymClass.id);
    expect(b1.status).toBe("booked");

    // User 2 books and should be waitlisted
    const b2 = await BookingService.bookClass(db, user2.id, gymClass.id);
    expect(b2.status).toBe("waitlisted");
    expect(b2.creditsUsed).toBe(0);

    // User 2's credits must remain untouched
    const m2 = await db.select().from(memberships).where(eq(memberships.userId, user2.id)).get();
    expect(m2?.creditsRemaining).toBe(5);
  });

  it("refunds credits and promotes waitlisted user when booking cancelled >12h before class", async () => {
    const { db } = testEnv;

    const user1 = await db
      .insert(users)
      .values({ name: "User 1", email: "u1@test.com", passwordHash: "h", role: "member" })
      .returning()
      .get();

    const user2 = await db
      .insert(users)
      .values({ name: "User 2", email: "u2@test.com", passwordHash: "h", role: "member" })
      .returning()
      .get();

    const plan = await db
      .insert(membershipPlans)
      .values({ name: "Plan", priceCents: 100, durationDays: 30, classCredits: 5 })
      .returning()
      .get();

    const [m1, m2] = await db.insert(memberships).values([
      { userId: user1.id, planId: plan.id, startDate: "2020-01-01", endDate: "2099-12-31", creditsRemaining: 5, status: "active" },
      { userId: user2.id, planId: plan.id, startDate: "2020-01-01", endDate: "2099-12-31", creditsRemaining: 5, status: "active" },
    ]).returning();

    // Class 24 hours in future (>12h free cancellation window)
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const gymClass = await db
      .insert(classes)
      .values({ name: "HIIT", room: "Studio B", capacity: 1, startsAt: futureDate, creditCost: 1 })
      .returning()
      .get();

    const b1 = await BookingService.bookClass(db, user1.id, gymClass.id);
    const b2 = await BookingService.bookClass(db, user2.id, gymClass.id);

    // Cancel User 1's booking
    const result = await BookingService.cancelBooking(db, { id: user1.id, role: "member" }, b1.id);
    expect(result.ok).toBe(true);
    expect(result.refunded).toBe(true);

    // User 1 credits restored
    const updatedM1 = await db.select().from(memberships).where(eq(memberships.id, m1.id)).get();
    expect(updatedM1?.creditsRemaining).toBe(5);

    // User 2 promoted from waitlisted to booked
    const updatedB2 = await db.select().from(bookings).where(eq(bookings.id, b2.id)).get();
    expect(updatedB2?.status).toBe("booked");
    expect(updatedB2?.creditsUsed).toBe(1);

    // User 2 credits deducted upon promotion
    const updatedM2 = await db.select().from(memberships).where(eq(memberships.id, m2.id)).get();
    expect(updatedM2?.creditsRemaining).toBe(4);
  });

  it("forfeits credits when cancelling <12h before class", async () => {
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

    const m = await db
      .insert(memberships)
      .values({ userId: user.id, planId: plan.id, startDate: "2020-01-01", endDate: "2099-12-31", creditsRemaining: 5, status: "active" })
      .returning()
      .get();

    // Class only 2 hours in future (< 12h cancellation threshold)
    const nearDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const gymClass = await db
      .insert(classes)
      .values({ name: "Boxing", room: "Studio B", capacity: 5, startsAt: nearDate, creditCost: 1 })
      .returning()
      .get();

    const booking = await BookingService.bookClass(db, user.id, gymClass.id);

    const result = await BookingService.cancelBooking(db, { id: user.id, role: "member" }, booking.id);
    expect(result.ok).toBe(true);
    expect(result.refunded).toBe(false); // Forfeited credit

    const updatedM = await db.select().from(memberships).where(eq(memberships.id, m.id)).get();
    expect(updatedM?.creditsRemaining).toBe(4); // Not refunded
  });
});
