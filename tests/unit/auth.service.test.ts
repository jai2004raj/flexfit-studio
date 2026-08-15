import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDatabase } from "../helpers/test-db";
import { AuthService } from "@/server/services/auth.service";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { TRPCError } from "@trpc/server";

describe("AuthService", () => {
  let testEnv: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testEnv = await createTestDatabase();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  it("registers a new user and denies duplicate emails", async () => {
    const { db } = testEnv;

    const registered = await AuthService.register(db, {
      email: "new@example.com",
      password: "password123",
      name: "New Member",
    });

    expect(registered.name).toBe("New Member");

    await expect(
      AuthService.register(db, {
        email: "new@example.com",
        password: "password123",
        name: "Duplicate Member",
      }),
    ).rejects.toThrow(TRPCError);
  });

  it("logs in with valid credentials and rejects invalid passwords", async () => {
    const { db } = testEnv;

    await db.insert(users).values({
      name: "Admin User",
      email: "admin@test.com",
      passwordHash: hashPassword("secure123"),
      role: "admin",
    });

    const loginResult = await AuthService.login(db, {
      email: "admin@test.com",
      password: "secure123",
    });

    expect(loginResult.name).toBe("Admin User");
    expect(loginResult.role).toBe("admin");

    await expect(
      AuthService.login(db, {
        email: "admin@test.com",
        password: "wrongpassword",
      }),
    ).rejects.toThrow(TRPCError);
  });

  it("rejects login for deactivated accounts", async () => {
    const { db } = testEnv;

    await db.insert(users).values({
      name: "Deactivated User",
      email: "deactivated@test.com",
      passwordHash: hashPassword("pass123"),
      role: "member",
      active: false,
    });

    await expect(
      AuthService.login(db, {
        email: "deactivated@test.com",
        password: "pass123",
      }),
    ).rejects.toThrow("This account has been deactivated.");
  });
});
