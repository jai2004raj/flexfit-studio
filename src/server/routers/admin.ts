import { router, adminProcedure } from "../trpc";
import { StatsService } from "../services/stats.service";
import { classUtilisationSchema } from "@/shared/schemas/admin.schema";

export const adminRouter = router({
  stats: adminProcedure.query(async ({ ctx }) => {
    return StatsService.getStats(ctx.db);
  }),

  classUtilisation: adminProcedure
    .input(classUtilisationSchema)
    .query(async ({ ctx, input }) => {
      return StatsService.getClassUtilisation(ctx.db, input.limit);
    }),

  revenueByMonth: adminProcedure.query(async ({ ctx }) => {
    return StatsService.getRevenueByMonth(ctx.db);
  }),

  revenueByMethod: adminProcedure.query(async ({ ctx }) => {
    return StatsService.getRevenueByMethod(ctx.db);
  }),

  expiringMemberships: adminProcedure.query(async ({ ctx }) => {
    return StatsService.getExpiringMemberships(ctx.db);
  }),

  refundCount: adminProcedure.query(async ({ ctx }) => {
    return StatsService.getRefundCount(ctx.db);
  }),

  checkinsPerDay: adminProcedure.query(async ({ ctx }) => {
    return StatsService.getCheckinsPerDay(ctx.db);
  }),

  topTrainers: adminProcedure.query(async ({ ctx }) => {
    return StatsService.getTopTrainers(ctx.db);
  }),

  noShowList: adminProcedure.query(async ({ ctx }) => {
    return StatsService.getNoShowList(ctx.db);
  }),
});
