import { router, protectedProcedure, staffProcedure } from "../trpc";
import { CorporateService } from "../services/corporate.service";
import {
  getMyCorporateBookingsSchema,
  bookCorporateClassSchema,
  cancelCorporateBookingSchema,
  markCorporateAttendedSchema,
  corporateRosterForSchema,
} from "@/shared/schemas/corporate.schema";
import { CORPORATE_FREE_CANCELLATION_HOURS } from "@/config/constants";

export { CORPORATE_FREE_CANCELLATION_HOURS };

export const corporateBookingsRouter = router({
  mine: protectedProcedure
    .input(getMyCorporateBookingsSchema)
    .query(async ({ ctx, input }) => {
      return CorporateService.getMyCorporateBookings(
        ctx.db,
        ctx.user.id,
        input.includePast,
      );
    }),

  book: protectedProcedure
    .input(bookCorporateClassSchema)
    .mutation(async ({ ctx, input }) => {
      return CorporateService.bookCorporateClass(
        ctx.db,
        ctx.user.id,
        input.classId,
      );
    }),

  cancel: protectedProcedure
    .input(cancelCorporateBookingSchema)
    .mutation(async ({ ctx, input }) => {
      return CorporateService.cancelCorporateBooking(
        ctx.db,
        ctx.user,
        input.bookingId,
      );
    }),

  markAttended: staffProcedure
    .input(markCorporateAttendedSchema)
    .mutation(async ({ ctx, input }) => {
      return CorporateService.markCorporateAttended(
        ctx.db,
        input.bookingId,
        input.source,
      );
    }),

  rosterFor: staffProcedure
    .input(corporateRosterForSchema)
    .query(async ({ ctx, input }) => {
      return CorporateService.getCorporateRosterForClass(ctx.db, input.classId);
    }),
});
