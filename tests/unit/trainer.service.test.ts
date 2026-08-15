import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDatabase } from "../helpers/test-db";
import { TrainerService } from "@/server/services/trainer.service";
import { users } from "@/db/schema";

describe("TrainerService", () => {
  let testEnv: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testEnv = await createTestDatabase();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  it("sets and retrieves weekly trainer availability", async () => {
    const { db } = testEnv;

    const trainer = await db
      .insert(users)
      .values({ name: "Trainer", email: "trainer@test.com", passwordHash: "h", role: "trainer" })
      .returning()
      .get();

    // Monday availability (dayOfWeek = 1)
    await TrainerService.setAvailability(db, trainer.id, {
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
    });

    const avail = await TrainerService.getAvailability(db, trainer.id);
    expect(avail.length).toBe(1);
    expect(avail[0].startTime).toBe("09:00");
    expect(avail[0].endTime).toBe("17:00");
  });
});
