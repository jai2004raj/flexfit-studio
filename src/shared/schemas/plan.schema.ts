import { z } from "zod";

export const listPlansSchema = z
  .object({
    includeInactive: z.boolean().default(false),
  })
  .default({});

export const subscribePlanSchema = z.object({
  planId: z.number().int().positive(),
  method: z.enum(["card", "cash", "upi", "transfer"]).default("card"),
});

export const createPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative("Price must be non-negative"),
  durationDays: z.number().int().positive("Duration must be positive"),
  classCredits: z.number().int().nonnegative().default(0),
});

export const setPlanActiveSchema = z.object({
  id: z.number().int().positive(),
  active: z.boolean(),
});

export type ListPlansInput = z.infer<typeof listPlansSchema>;
export type SubscribePlanInput = z.infer<typeof subscribePlanSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type SetPlanActiveInput = z.infer<typeof setPlanActiveSchema>;
