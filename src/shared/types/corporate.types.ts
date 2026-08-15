import type { Company, BookingStatus } from "./common.types";

export interface CorporateMemberBookingItem {
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
  companyName: string;
}

export interface CorporateRosterEntry {
  bookingId: number;
  status: BookingStatus;
  memberId: number;
  memberName: string;
  memberEmail: string;
  bookedAt: string;
  companyName: string;
}

export interface CompanyLinkedMember {
  id: number;
  companyMemberId: number;
  name: string;
  email: string;
  phone: string | null;
}

export interface CompanyRecentBooking {
  id: number;
  status: BookingStatus;
  creditsUsed: number;
  bookedAt: string;
  className: string;
  startsAt: string;
  memberName: string;
}

export interface CompanyWithDetails extends Company {
  members: CompanyLinkedMember[];
  recentBookings: CompanyRecentBooking[];
}
