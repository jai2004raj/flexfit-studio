import { z } from "zod";

export const listClassesSchema = z
  .object({
    from: z.string().optional(),
    to: z.string().optional(),
    includeCancelled: z.boolean().default(false),
  })
  .default({});

export const classByIdSchema = z.object({
  id: z.number().int().positive(),
});

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  description: z.string().optional(),
  trainerId: z.number().int().positive().optional(),
  room: z.string().min(1, "Room is required"),
  capacity: z.number().int().positive("Capacity must be positive"),
  startsAt: z.string().min(1, "Start time is required"),
  durationMin: z.number().int().positive().default(60),
  creditCost: z.number().int().min(0).default(1),
});

export const updateClassSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).optional(),
  room: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  startsAt: z.string().optional(),
  trainerId: z.number().int().positive().nullable().optional(),
});

export const cancelClassSchema = z.object({
  id: z.number().int().positive(),
});

export type ListClassesInput = z.infer<typeof listClassesSchema>;
export type ClassByIdInput = z.infer<typeof classByIdSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CancelClassInput = z.infer<typeof cancelClassSchema>;
