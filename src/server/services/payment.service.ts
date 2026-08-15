import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { Database } from "@/db";
import { payments, users, memberships, membershipPlans, type Payment } from "@/db/schema";
import type {
  MemberPaymentItem,
  AdminPaymentItem,
} from "@/shared/types/payment.types";

export class PaymentService {
  static async getMyPayments(
    db: Database,
    userId: number,
  ): Promise<MemberPaymentItem[]> {
    return db
      .select({
        id: payments.id,
        amountCents: payments.amountCents,
        method: payments.method,
        status: payments.status,
        reference: payments.reference,
        createdAt: payments.createdAt,
        planName: membershipPlans.name,
      })
      .from(payments)
      .leftJoin(memberships, eq(payments.membershipId, memberships.id))
      .leftJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  static async getAllPayments(
    db: Database,
    limit = 100,
  ): Promise<AdminPaymentItem[]> {
    return db
      .select({
        id: payments.id,
        amountCents: payments.amountCents,
        method: payments.method,
        status: payments.status,
        reference: payments.reference,
        createdAt: payments.createdAt,
        memberName: users.name,
        memberEmail: users.email,
      })
      .from(payments)
      .innerJoin(users, eq(payments.userId, users.id))
      .orderBy(desc(payments.createdAt))
      .limit(limit);
  }

  static async markPaymentPaid(
    db: Database,
    id: number,
  ): Promise<Payment> {
    const row = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .get();

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found." });
    }
    if (row.status === "refunded") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Refunded payments cannot be marked paid.",
      });
    }

    const updated = await db
      .update(payments)
      .set({ status: "paid" })
      .where(eq(payments.id, id))
      .returning()
      .get();

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found." });
    }

    return updated;
  }

  static async refundPayment(
    db: Database,
    id: number,
  ): Promise<Payment> {
    const row = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .get();

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found." });
    }
    if (row.status !== "paid") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only paid payments can be refunded.",
      });
    }

    const updated = await db
      .update(payments)
      .set({ status: "refunded" })
      .where(eq(payments.id, id))
      .returning()
      .get();

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found." });
    }

    if (row.membershipId) {
      await db
        .update(memberships)
        .set({ status: "cancelled" })
        .where(eq(memberships.id, row.membershipId));
    }

    return updated;
  }
}
