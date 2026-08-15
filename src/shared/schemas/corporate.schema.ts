import { z } from "zod";

export const getMyCorporateBookingsSchema = z
  .object({
    includePast: z.boolean().default(false),
  })
  .default({});

export const bookCorporateClassSchema = z.object({
  classId: z.number().int().positive(),
});

export const cancelCorporateBookingSchema = z.object({
  bookingId: z.number().int().positive(),
});

export const markCorporateAttendedSchema = z.object({
  bookingId: z.number().int().positive(),
  source: z.enum(["front_desk", "kiosk", "app"]).default("front_desk"),
});

export const corporateRosterForSchema = z.object({
  classId: z.number().int().positive(),
});

export const companyByIdSchema = z.object({
  id: z.number().int().positive(),
});

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  contactEmail: z.string().email("Invalid contact email"),
  creditPoolBalance: z.number().int().nonnegative().default(0),
});

export const updateCompanyActiveSchema = z.object({
  id: z.number().int().positive(),
  active: z.boolean(),
});

export const topUpCompanyCreditsSchema = z.object({
  id: z.number().int().positive(),
  amount: z.number().int().positive("Top up amount must be positive"),
});

export const linkCompanyMemberSchema = z.object({
  companyId: z.number().int().positive(),
  userId: z.number().int().positive(),
});

export const unlinkCompanyMemberSchema = z.object({
  companyMemberId: z.number().int().positive(),
});

export type GetMyCorporateBookingsInput = z.infer<typeof getMyCorporateBookingsSchema>;
export type BookCorporateClassInput = z.infer<typeof bookCorporateClassSchema>;
export type CancelCorporateBookingInput = z.infer<typeof cancelCorporateBookingSchema>;
export type MarkCorporateAttendedInput = z.infer<typeof markCorporateAttendedSchema>;
export type CorporateRosterForInput = z.infer<typeof corporateRosterForSchema>;
export type CompanyByIdInput = z.infer<typeof companyByIdSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyActiveInput = z.infer<typeof updateCompanyActiveSchema>;
export type TopUpCompanyCreditsInput = z.infer<typeof topUpCompanyCreditsSchema>;
export type LinkCompanyMemberInput = z.infer<typeof linkCompanyMemberSchema>;
export type UnlinkCompanyMemberInput = z.infer<typeof unlinkCompanyMemberSchema>;
