import { cookies } from "next/headers";
import {
  router,
  publicProcedure,
  protectedProcedure,
  SESSION_COOKIE,
} from "../trpc";
import { AuthService } from "../services/auth.service";
import { loginSchema, registerSchema } from "@/shared/schemas/auth.schema";

export { SESSION_COOKIE };

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      const store = await cookies();
      return AuthService.login(ctx.db, input, store);
    }),

  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      return AuthService.register(ctx.db, input);
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const store = await cookies();
    return AuthService.logout(ctx.db, ctx.token, store);
  }),
});
