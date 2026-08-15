import { z } from "zod";

export const allPaymentsSchema = z
  .object({
    limit: z.number().int().positive().default(100),
  })
  .default({});

export const paymentByIdSchema = z.object({
  id: z.number().int().positive(),
});

export type AllPaymentsInput = z.infer<typeof allPaymentsSchema>;
export type PaymentByIdInput = z.infer<typeof paymentByIdSchema>;
