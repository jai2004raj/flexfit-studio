import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDatabase } from "../helpers/test-db";
import { CorporateService } from "@/server/services/corporate.service";
import { users, classes, companies, companyMembers, corporateBookings } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("CorporateService", () => {
  let testEnv: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testEnv = await createTestDatabase();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  it("books corporate class and deducts credits from company credit pool", async () => {
    const { db } = testEnv;

    const user = await db
      .insert(users)
      .values({ name: "Employee 1", email: "emp1@corp.com", passwordHash: "h", role: "member" })
      .returning()
      .get();

    const company = await db
      .insert(companies)
      .values({ name: "TechCorp", contactEmail: "contact@techcorp.com", creditPoolBalance: 20 })
      .returning()
      .get();

    await db.insert(companyMembers).values({ userId: user.id, companyId: company.id });

    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const gymClass = await db
      .insert(classes)
      .values({ name: "Corporate Boxing", room: "Studio B", capacity: 10, startsAt: futureDate, creditCost: 2 })
      .returning()
      .get();

    const booking = await CorporateService.bookCorporateClass(db, user.id, gymClass.id);
    expect(booking.status).toBe("booked");
    expect(booking.creditsUsed).toBe(2);

    const updatedCompany = await db.select().from(companies).where(eq(companies.id, company.id)).get();
    expect(updatedCompany?.creditPoolBalance).toBe(18);
  });

  it("refunds credits to company pool when cancelled >24h before class", async () => {
    const { db } = testEnv;

    const user = await db
      .insert(users)
      .values({ name: "Employee 1", email: "emp1@corp.com", passwordHash: "h", role: "member" })
      .returning()
      .get();

    const company = await db
      .insert(companies)
      .values({ name: "TechCorp", contactEmail: "contact@techcorp.com", creditPoolBalance: 20 })
      .returning()
      .get();

    await db.insert(companyMembers).values({ userId: user.id, companyId: company.id });

    // 48 hours in future (>24h corporate free cancellation window)
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const gymClass = await db
      .insert(classes)
      .values({ name: "Yoga", room: "Studio A", capacity: 10, startsAt: futureDate, creditCost: 1 })
      .returning()
      .get();

    const booking = await CorporateService.bookCorporateClass(db, user.id, gymClass.id);

    const result = await CorporateService.cancelCorporateBooking(db, { id: user.id, role: "member" }, booking.id);
    expect(result.ok).toBe(true);
    expect(result.refunded).toBe(true);

    const updatedCompany = await db.select().from(companies).where(eq(companies.id, company.id)).get();
    expect(updatedCompany?.creditPoolBalance).toBe(20);
  });

  it("handles company credit top up and member linking", async () => {
    const { db } = testEnv;

    const company = await CorporateService.createCompany(db, {
      name: "NewCorp",
      contactEmail: "admin@newcorp.com",
      creditPoolBalance: 5,
    });

    const toppedUp = await CorporateService.topUpCompanyCredits(db, company.id, 15);
    expect(toppedUp.creditPoolBalance).toBe(20);

    const user = await db
      .insert(users)
      .values({ name: "Emp", email: "emp@newcorp.com", passwordHash: "h", role: "member" })
      .returning()
      .get();

    const link = await CorporateService.linkCompanyMember(db, company.id, user.id);
    expect(link.userId).toBe(user.id);
  });
});
