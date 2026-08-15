import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDatabase } from "../helpers/test-db";
import { StatsService } from "@/server/services/stats.service";
import { users, payments, memberships, membershipPlans } from "@/db/schema";

describe("StatsService", () => {
  let testEnv: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testEnv = await createTestDatabase();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  it("calculates studio admin statistics correctly", async () => {
    const { db } = testEnv;

    const user = await db
      .insert(users)
      .values({ name: "Member", email: "m@test.com", passwordHash: "h", role: "member" })
      .returning()
      .get();

    const plan = await db
      .insert(membershipPlans)
      .values({ name: "Plan", priceCents: 5000, durationDays: 30, classCredits: 10 })
      .returning()
      .get();

    const membership = await db
      .insert(memberships)
      .values({
        userId: user.id,
        planId: plan.id,
        startDate: "2020-01-01",
        endDate: "2099-12-31",
        creditsRemaining: 10,
        status: "active",
      })
      .returning()
      .get();

    await db.insert(payments).values([
      { userId: user.id, membershipId: membership.id, amountCents: 5000, method: "card", status: "paid" },
      { userId: user.id, membershipId: membership.id, amountCents: 2500, method: "upi", status: "pending" },
    ]);

    const stats = await StatsService.getStats(db);
    expect(stats.totalMembers).toBe(1);
    expect(stats.activeMemberships).toBe(1);
    expect(stats.revenueCents).toBe(5000);
    expect(stats.pendingPayments).toBe(1);
  });
});
