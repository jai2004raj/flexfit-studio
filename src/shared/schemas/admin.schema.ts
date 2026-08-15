import { z } from "zod";

export const classUtilisationSchema = z
  .object({
    limit: z.number().int().positive().default(10),
  })
  .default({});

export type ClassUtilisationInput = z.infer<typeof classUtilisationSchema>;
