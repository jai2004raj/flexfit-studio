import {
  router,
  protectedProcedure,
  adminProcedure,
} from "../trpc";
import { PaymentService } from "../services/payment.service";
import {
  allPaymentsSchema,
  paymentByIdSchema,
} from "@/shared/schemas/payment.schema";

export const paymentsRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => {
    return PaymentService.getMyPayments(ctx.db, ctx.user.id);
  }),

  all: adminProcedure
    .input(allPaymentsSchema)
    .query(async ({ ctx, input }) => {
      return PaymentService.getAllPayments(ctx.db, input.limit);
    }),

  markPaid: adminProcedure
    .input(paymentByIdSchema)
    .mutation(async ({ ctx, input }) => {
      return PaymentService.markPaymentPaid(ctx.db, input.id);
    }),

  refund: adminProcedure
    .input(paymentByIdSchema)
    .mutation(async ({ ctx, input }) => {
      return PaymentService.refundPayment(ctx.db, input.id);
    }),
});
