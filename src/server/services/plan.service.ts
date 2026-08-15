import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { Database } from "@/db";
import { membershipPlans, memberships, payments, type MembershipPlan, type Membership } from "@/db/schema";
import { addDays, getTodayDateString } from "@/lib/date";
import type { PaymentMethod } from "@/shared/types/common.types";
import type {
  CreatePlanInput,
  ListPlansInput,
} from "@/shared/schemas/plan.schema";

export class PlanService {
  static async listPlans(
    db: Database,
    input: Partial<ListPlansInput> = {},
  ): Promise<MembershipPlan[]> {
    const rows = await db.select().from(membershipPlans);
    return input.includeInactive ? rows : rows.filter((p) => p.active);
  }

  static async subscribePlan(
    db: Database,
    userId: number,
    planId: number,
    method: PaymentMethod = "card",
  ): Promise<Membership> {
    const plan = await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.id, planId))
      .get();

    if (!plan) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });
    }
    if (!plan.active) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This plan is no longer available.",
      });
    }

    const today = getTodayDateString();

    const membership = await db
      .insert(memberships)
      .values({
        userId,
        planId: plan.id,
        startDate: today,
        endDate: addDays(today, plan.durationDays),
        creditsRemaining: plan.classCredits,
        status: "active",
      })
      .returning()
      .get();

    await db.insert(payments).values({
      userId,
      membershipId: membership.id,
      amountCents: plan.priceCents,
      method,
      status: "paid",
      reference: `PAY-${Date.now()}`,
    });

    return membership;
  }

  static async createPlan(
    db: Database,
    input: CreatePlanInput,
  ): Promise<MembershipPlan> {
    return db
      .insert(membershipPlans)
      .values({ ...input, description: input.description ?? null })
      .returning()
      .get();
  }

  static async setPlanActive(
    db: Database,
    id: number,
    active: boolean,
  ): Promise<MembershipPlan> {
    const updated = await db
      .update(membershipPlans)
      .set({ active })
      .where(eq(membershipPlans.id, id))
      .returning()
      .get();

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });
    }

    return updated;
  }
}
