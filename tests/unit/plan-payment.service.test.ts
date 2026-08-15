import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDatabase } from "../helpers/test-db";
import { PlanService } from "@/server/services/plan.service";
import { PaymentService } from "@/server/services/payment.service";
import { users, memberships } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Plan & Payment Services", () => {
  let testEnv: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testEnv = await createTestDatabase();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  it("subscribes to a plan and creates an associated payment", async () => {
    const { db } = testEnv;

    const user = await db
      .insert(users)
      .values({ name: "Subscriber", email: "sub@test.com", passwordHash: "h", role: "member" })
      .returning()
      .get();

    const plan = await PlanService.createPlan(db, {
      name: "Monthly Unlimited",
      priceCents: 9900,
      durationDays: 30,
      classCredits: 999,
    });

    const membership = await PlanService.subscribePlan(db, user.id, plan.id, "card");
    expect(membership.status).toBe("active");
    expect(membership.creditsRemaining).toBe(999);

    const payments = await PaymentService.getMyPayments(db, user.id);
    expect(payments.length).toBe(1);
    expect(payments[0].amountCents).toBe(9900);
    expect(payments[0].status).toBe("paid");
  });

  it("refunds payment and cancels corresponding membership", async () => {
    const { db } = testEnv;

    const user = await db
      .insert(users)
      .values({ name: "User", email: "u@test.com", passwordHash: "h", role: "member" })
      .returning()
      .get();

    const plan = await PlanService.createPlan(db, {
      name: "Single Class",
      priceCents: 1500,
      durationDays: 7,
      classCredits: 1,
    });

    const membership = await PlanService.subscribePlan(db, user.id, plan.id, "upi");
    const [payment] = await PaymentService.getMyPayments(db, user.id);

    const refunded = await PaymentService.refundPayment(db, payment.id);
    expect(refunded.status).toBe("refunded");

    const updatedMembership = await db
      .select()
      .from(memberships)
      .where(eq(memberships.id, membership.id))
      .get();
    expect(updatedMembership?.status).toBe("cancelled");
  });
});
