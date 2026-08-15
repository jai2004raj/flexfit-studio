import {
  router,
  publicProcedure,
  staffProcedure,
  adminProcedure,
} from "../trpc";
import { ClassService } from "../services/class.service";
import {
  listClassesSchema,
  classByIdSchema,
  createClassSchema,
  updateClassSchema,
  cancelClassSchema,
} from "@/shared/schemas/class.schema";

export const classesRouter = router({
  list: publicProcedure
    .input(listClassesSchema)
    .query(async ({ ctx, input }) => {
      return ClassService.listClasses(ctx.db, input);
    }),

  byId: publicProcedure
    .input(classByIdSchema)
    .query(async ({ ctx, input }) => {
      return ClassService.getClassById(ctx.db, input.id);
    }),

  create: staffProcedure
    .input(createClassSchema)
    .mutation(async ({ ctx, input }) => {
      return ClassService.createClass(ctx.db, input);
    }),

  update: staffProcedure
    .input(updateClassSchema)
    .mutation(async ({ ctx, input }) => {
      return ClassService.updateClass(ctx.db, input);
    }),

  cancel: adminProcedure
    .input(cancelClassSchema)
    .mutation(async ({ ctx, input }) => {
      return ClassService.cancelClass(ctx.db, input.id);
    }),
});
