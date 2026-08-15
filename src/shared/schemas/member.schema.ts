import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().nullable().optional(),
});

export const searchMembersSchema = z
  .object({
    q: z.string().default(""),
    limit: z.number().int().positive().default(50),
  })
  .default({});

export const memberByIdSchema = z.object({
  id: z.number().int().positive(),
});

export const setMemberActiveSchema = z.object({
  id: z.number().int().positive(),
  active: z.boolean(),
});

export const setMemberRoleSchema = z.object({
  id: z.number().int().positive(),
  role: z.enum(["member", "trainer", "admin"]),
});

export const lookupMemberSchema = z.object({
  query: z.string().min(1, "Query is required"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SearchMembersInput = z.infer<typeof searchMembersSchema>;
export type MemberByIdInput = z.infer<typeof memberByIdSchema>;
export type SetMemberActiveInput = z.infer<typeof setMemberActiveSchema>;
export type SetMemberRoleInput = z.infer<typeof setMemberRoleSchema>;
export type LookupMemberInput = z.infer<typeof lookupMemberSchema>;
