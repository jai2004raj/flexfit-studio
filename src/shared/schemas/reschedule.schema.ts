import { z } from "zod";

export const rescheduleClassSchema = z.object({
  fromBookingId: z.number().int().positive(),
  toClassId: z.number().int().positive(),
});

export const validateRescheduleSchema = z.object({
  fromBookingId: z.number().int().positive(),
  toClassId: z.number().int().positive(),
});

export type RescheduleClassInput = z.infer<typeof rescheduleClassSchema>;
export type ValidateRescheduleInput = z.infer<typeof validateRescheduleSchema>;
