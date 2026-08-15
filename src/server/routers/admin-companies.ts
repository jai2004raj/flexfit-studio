import { router, adminProcedure } from "../trpc";
import { CorporateService } from "../services/corporate.service";
import {
  companyByIdSchema,
  createCompanySchema,
  updateCompanyActiveSchema,
  topUpCompanyCreditsSchema,
  linkCompanyMemberSchema,
  unlinkCompanyMemberSchema,
} from "@/shared/schemas/corporate.schema";

export const adminCompaniesRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return CorporateService.listCompanies(ctx.db);
  }),

  getById: adminProcedure
    .input(companyByIdSchema)
    .query(async ({ ctx, input }) => {
      return CorporateService.getCompanyById(ctx.db, input.id);
    }),

  create: adminProcedure
    .input(createCompanySchema)
    .mutation(async ({ ctx, input }) => {
      return CorporateService.createCompany(ctx.db, input);
    }),

  updateActive: adminProcedure
    .input(updateCompanyActiveSchema)
    .mutation(async ({ ctx, input }) => {
      return CorporateService.updateCompanyActive(ctx.db, input.id, input.active);
    }),

  topUp: adminProcedure
    .input(topUpCompanyCreditsSchema)
    .mutation(async ({ ctx, input }) => {
      return CorporateService.topUpCompanyCredits(ctx.db, input.id, input.amount);
    }),

  linkMember: adminProcedure
    .input(linkCompanyMemberSchema)
    .mutation(async ({ ctx, input }) => {
      return CorporateService.linkCompanyMember(
        ctx.db,
        input.companyId,
        input.userId,
      );
    }),

  unlinkMember: adminProcedure
    .input(unlinkCompanyMemberSchema)
    .mutation(async ({ ctx, input }) => {
      return CorporateService.unlinkCompanyMember(ctx.db, input.companyMemberId);
    }),
});
