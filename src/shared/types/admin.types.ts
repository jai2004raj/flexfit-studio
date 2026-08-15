export interface AdminStats {
  totalMembers: number;
  activeMemberships: number;
  upcomingClasses: number;
  revenueCents: number;
  totalCheckins: number;
  pendingPayments: number;
}

export interface ClassUtilisationItem {
  id: number;
  name: string;
  startsAt: string;
  capacity: number;
  booked: number;
  utilisation: number;
}

export interface RevenueByMonthItem {
  month: string;
  totalCents: number;
}

export interface RevenueByMethodItem {
  method: string;
  totalCents: number;
  count: number;
}

export interface ExpiringMembershipItem {
  memberId: number;
  memberName: string;
  memberEmail: string;
  planName: string;
  expiresAt: string;
}

export interface CheckinsPerDayItem {
  date: string;
  count: number;
}

export interface TopTrainerItem {
  trainerId: number | null;
  trainerName: string | null;
  classCount: number;
  attendedCount: number;
}

export interface NoShowItem {
  bookingId: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  className: string;
  classDate: string;
  trainerId: number | null;
  trainerName?: string;
}
