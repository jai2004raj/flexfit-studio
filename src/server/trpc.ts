import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { cookies } from "next/headers";
import { db } from "@/db";
import type { User } from "@/db/schema";
import { SESSION_COOKIE } from "@/config/constants";
import { AuthService } from "./services/auth.service";

export { SESSION_COOKIE };

export async function createContext() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  let user: User | null = null;

  if (token) {
    user = await AuthService.getUserFromToken(db, token);
  }

  return { db, user, token };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "trainer") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Staff only." });
  }
  return next({ ctx });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admins only." });
  }
  return next({ ctx });
});
