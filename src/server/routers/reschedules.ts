import { router, protectedProcedure } from "../trpc";
import { RescheduleService } from "../services/reschedule.service";
import {
  rescheduleClassSchema,
  validateRescheduleSchema,
} from "@/shared/schemas/reschedule.schema";
import { FREE_RESCHEDULE_HOURS } from "@/config/constants";

export { FREE_RESCHEDULE_HOURS };

export const reschedulesRouter = router({
  reschedule: protectedProcedure
    .input(rescheduleClassSchema)
    .mutation(async ({ ctx, input }) => {
      return RescheduleService.rescheduleBooking(
        ctx.db,
        ctx.user.id,
        input.fromBookingId,
        input.toClassId,
      );
    }),

  history: protectedProcedure.query(async ({ ctx }) => {
    return RescheduleService.getRescheduleHistory(ctx.db, ctx.user.id);
  }),

  validateReschedule: protectedProcedure
    .input(validateRescheduleSchema)
    .query(async ({ ctx, input }) => {
      return RescheduleService.validateReschedule(
        ctx.db,
        ctx.user.id,
        input.fromBookingId,
        input.toClassId,
      );
    }),
});
