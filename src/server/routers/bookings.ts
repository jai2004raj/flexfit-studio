import { router, protectedProcedure, staffProcedure } from "../trpc";
import { BookingService } from "../services/booking.service";
import {
  getMyBookingsSchema,
  bookClassSchema,
  cancelBookingSchema,
  markAttendedSchema,
  rosterForSchema,
  upcomingForMemberSchema,
  checkinCountForSchema,
} from "@/shared/schemas/booking.schema";
import { FREE_CANCELLATION_HOURS, UNLIMITED_CREDITS } from "@/config/constants";

export { FREE_CANCELLATION_HOURS, UNLIMITED_CREDITS };

export const bookingsRouter = router({
  mine: protectedProcedure
    .input(getMyBookingsSchema)
    .query(async ({ ctx, input }) => {
      return BookingService.getMyBookings(ctx.db, ctx.user.id, input.includePast);
    }),

  book: protectedProcedure
    .input(bookClassSchema)
    .mutation(async ({ ctx, input }) => {
      return BookingService.bookClass(ctx.db, ctx.user.id, input.classId);
    }),

  cancel: protectedProcedure
    .input(cancelBookingSchema)
    .mutation(async ({ ctx, input }) => {
      return BookingService.cancelBooking(ctx.db, ctx.user, input.bookingId);
    }),

  markAttended: staffProcedure
    .input(markAttendedSchema)
    .mutation(async ({ ctx, input }) => {
      return BookingService.markAttended(ctx.db, input.bookingId, input.source);
    }),

  rosterFor: staffProcedure
    .input(rosterForSchema)
    .query(async ({ ctx, input }) => {
      return BookingService.getRosterForClass(ctx.db, input.classId);
    }),

  upcomingForMember: staffProcedure
    .input(upcomingForMemberSchema)
    .query(async ({ ctx, input }) => {
      return BookingService.getUpcomingForMember(
        ctx.db,
        input.userId,
        input.hoursAhead,
      );
    }),

  checkinCountFor: staffProcedure
    .input(checkinCountForSchema)
    .query(async ({ ctx, input }) => {
      return BookingService.getCheckinCountForClass(ctx.db, input.classId);
    }),

  waitlisted: protectedProcedure.query(async ({ ctx }) => {
    return BookingService.getWaitlistedBookings(ctx.db, ctx.user.id);
  }),
});
