import { z } from "zod";

export const getMyBookingsSchema = z
  .object({
    includePast: z.boolean().default(false),
  })
  .default({});

export const bookClassSchema = z.object({
  classId: z.number().int().positive(),
});

export const cancelBookingSchema = z.object({
  bookingId: z.number().int().positive(),
});

export const markAttendedSchema = z.object({
  bookingId: z.number().int().positive(),
  source: z.enum(["front_desk", "kiosk", "app"]).default("front_desk"),
});

export const rosterForSchema = z.object({
  classId: z.number().int().positive(),
});

export const upcomingForMemberSchema = z.object({
  userId: z.number().int().positive(),
  hoursAhead: z.number().positive().default(2),
});

export const checkinCountForSchema = z.object({
  classId: z.number().int().positive(),
});

export type GetMyBookingsInput = z.infer<typeof getMyBookingsSchema>;
export type BookClassInput = z.infer<typeof bookClassSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type MarkAttendedInput = z.infer<typeof markAttendedSchema>;
export type RosterForInput = z.infer<typeof rosterForSchema>;
export type UpcomingForMemberInput = z.infer<typeof upcomingForMemberSchema>;
export type CheckinCountForInput = z.infer<typeof checkinCountForSchema>;
