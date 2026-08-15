import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { TrainerService } from "../services/trainer.service";
import {
  setTrainerAvailabilitySchema,
  removeTrainerAvailabilitySchema,
  checkTrainerAvailabilitySchema,
} from "@/shared/schemas/trainer.schema";

export const trainersRouter = router({
  upcomingClasses: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "trainer") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only trainers can access this.",
      });
    }

    return TrainerService.getUpcomingClasses(ctx.db, ctx.user.id);
  }),

  availability: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "trainer") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only trainers can access this.",
      });
    }

    return TrainerService.getAvailability(ctx.db, ctx.user.id);
  }),

  setAvailability: protectedProcedure
    .input(setTrainerAvailabilitySchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "trainer") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only trainers can access this.",
        });
      }

      return TrainerService.setAvailability(ctx.db, ctx.user.id, input);
    }),

  removeAvailability: protectedProcedure
    .input(removeTrainerAvailabilitySchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "trainer") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only trainers can access this.",
        });
      }

      return TrainerService.removeAvailability(
        ctx.db,
        ctx.user.id,
        input.dayOfWeek,
      );
    }),

  checkAvailability: protectedProcedure
    .input(checkTrainerAvailabilitySchema)
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "trainer" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Staff only.",
        });
      }

      return TrainerService.checkAvailability(ctx.db, input);
    }),
});
