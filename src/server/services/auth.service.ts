import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { Database } from "@/db";
import { users, sessions, type User } from "@/db/schema";
import { verifyPassword, hashPassword } from "@/lib/password";
import { SESSION_DAYS, SESSION_COOKIE } from "@/config/constants";
import type { LoginInput, RegisterInput } from "@/shared/schemas/auth.schema";
import type { LoginResult, RegisterResult } from "@/shared/types/auth.types";

export interface CookieStore {
  set(
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      sameSite: "lax" | "strict" | "none";
      path: string;
      expires: Date;
    },
  ): void;
  delete(name: string): void;
}

export class AuthService {
  static async getUserFromToken(db: Database, token: string): Promise<User | null> {
    const row = await db
      .select({ session: sessions, user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .get();

    if (row && new Date(row.session.expiresAt) > new Date()) {
      return row.user;
    }
    return null;
  }

  static async login(
    db: Database,
    input: LoginInput,
    cookieStore?: CookieStore,
  ): Promise<LoginResult> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email.toLowerCase().trim()))
      .get();

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Email or password is incorrect.",
      });
    }

    if (!user.active) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This account has been deactivated.",
      });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt: expiresAt.toISOString(),
    });

    if (cookieStore) {
      cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      });
    }

    return { id: user.id, name: user.name, role: user.role };
  }

  static async register(
    db: Database,
    input: RegisterInput,
  ): Promise<RegisterResult> {
    const email = input.email.toLowerCase().trim();
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An account with that email already exists.",
      });
    }

    const created = await db
      .insert(users)
      .values({
        email,
        passwordHash: hashPassword(input.password),
        name: input.name,
        phone: input.phone ?? null,
        role: "member",
      })
      .returning()
      .get();

    return { id: created.id, name: created.name };
  }

  static async logout(
    db: Database,
    token?: string | null,
    cookieStore?: CookieStore,
  ): Promise<{ ok: boolean }> {
    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
    }
    if (cookieStore) {
      cookieStore.delete(SESSION_COOKIE);
    }
    return { ok: true };
  }
}
