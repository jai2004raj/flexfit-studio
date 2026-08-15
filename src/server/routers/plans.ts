import {
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "../trpc";
import { PlanService } from "../services/plan.service";
import {
  listPlansSchema,
  subscribePlanSchema,
  createPlanSchema,
  setPlanActiveSchema,
} from "@/shared/schemas/plan.schema";

export const plansRouter = router({
  list: publicProcedure
    .input(listPlansSchema)
    .query(async ({ ctx, input }) => {
      return PlanService.listPlans(ctx.db, input);
    }),

  subscribe: protectedProcedure
    .input(subscribePlanSchema)
    .mutation(async ({ ctx, input }) => {
      return PlanService.subscribePlan(
        ctx.db,
        ctx.user.id,
        input.planId,
        input.method,
      );
    }),

  create: adminProcedure
    .input(createPlanSchema)
    .mutation(async ({ ctx, input }) => {
      return PlanService.createPlan(ctx.db, input);
    }),

  setActive: adminProcedure
    .input(setPlanActiveSchema)
    .mutation(async ({ ctx, input }) => {
      return PlanService.setPlanActive(ctx.db, input.id, input.active);
    }),
});
