import { describe, it, expect } from "vitest";
import {
  hoursUntil,
  addDays,
  getTodayDateString,
  isTimeRangeOverlapping,
  isDateTimeOverlapping,
} from "@/lib/date";

describe("Date Utilities", () => {
  it("calculates hoursUntil correctly", () => {
    const now = new Date("2026-08-15T12:00:00.000Z");
    const future = "2026-08-15T15:00:00.000Z";
    const past = "2026-08-15T08:00:00.000Z";

    expect(hoursUntil(future, now)).toBe(3);
    expect(hoursUntil(past, now)).toBe(-4);
  });

  it("adds days correctly", () => {
    expect(addDays("2026-08-15", 5)).toBe("2026-08-20");
    expect(addDays("2026-08-15", 30)).toBe("2026-09-14");
  });

  it("formats today date string", () => {
    const now = new Date("2026-08-15T10:30:00.000Z");
    expect(getTodayDateString(now)).toBe("2026-08-15");
  });

  it("detects overlapping time ranges", () => {
    expect(isTimeRangeOverlapping("09:00", "10:00", "09:30", "10:30")).toBe(true);
    expect(isTimeRangeOverlapping("09:00", "10:00", "10:00", "11:00")).toBe(false);
    expect(isTimeRangeOverlapping("10:00", "11:00", "08:00", "09:30")).toBe(false);
  });

  it("detects overlapping datetimes", () => {
    const startA = new Date("2026-08-15T09:00:00.000Z");
    const endA = new Date("2026-08-15T10:00:00.000Z");
    const startB = new Date("2026-08-15T09:30:00.000Z");
    const endB = new Date("2026-08-15T10:30:00.000Z");
    const startC = new Date("2026-08-15T10:00:00.000Z");
    const endC = new Date("2026-08-15T11:00:00.000Z");

    expect(isDateTimeOverlapping(startA, endA, startB, endB)).toBe(true);
    expect(isDateTimeOverlapping(startA, endA, startC, endC)).toBe(false);
  });
});
