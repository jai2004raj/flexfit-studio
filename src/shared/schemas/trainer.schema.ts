import { z } from "zod";

export const setTrainerAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

export const removeTrainerAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
});

export const checkTrainerAvailabilitySchema = z.object({
  trainerId: z.number().int().positive(),
  startsAt: z.string().min(1, "Start time is required"),
  durationMin: z.number().int().positive(),
});

export type SetTrainerAvailabilityInput = z.infer<typeof setTrainerAvailabilitySchema>;
export type RemoveTrainerAvailabilityInput = z.infer<typeof removeTrainerAvailabilitySchema>;
export type CheckTrainerAvailabilityInput = z.infer<typeof checkTrainerAvailabilitySchema>;
