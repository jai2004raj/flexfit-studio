import type { BookingStatus, CheckinSource } from "./common.types";

export interface MemberBookingItem {
  id: number;
  status: BookingStatus;
  creditsUsed: number;
  bookedAt: string;
  classId: number;
  className: string;
  room: string;
  startsAt: string;
  durationMin: number;
  cancelled: boolean;
}

export interface WaitlistedBookingItem {
  bookingId: number;
  classId: number;
  className: string;
  room: string;
  startsAt: string;
  durationMin: number;
  capacity: number;
  bookedAt: string;
  position: number;
}

export interface RosterEntry {
  bookingId: number;
  status: BookingStatus;
  memberId: number;
  memberName: string;
  memberEmail: string;
  bookedAt: string;
}

export interface UpcomingMemberClass {
  bookingId: number;
  bookingStatus: BookingStatus;
  classId: number;
  className: string;
  room: string;
  startsAt: string;
  durationMin: number;
  capacity: number;
  trainerId: number | null;
  trainerName: string | null;
}

export interface CancelBookingResult {
  ok: boolean;
  refunded: boolean;
}
