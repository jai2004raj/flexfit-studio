import type { Booking } from "./common.types";

export interface RescheduleResult {
  ok: boolean;
  newBooking: Booking;
  newStatus: "waitlisted" | "booked";
}

export interface RescheduleHistoryItem {
  id: number;
  rescheduledAt: string;
  fromClassName: string;
  fromClassTime: string | null;
  fromClassRoom: string | null;
  toClassName: string | null;
  toClassTime: string | null;
  toClassRoom: string | null;
}

export type RescheduleValidationResult =
  | { valid: true; targetIsFull: boolean }
  | { valid: false; reason: string };
