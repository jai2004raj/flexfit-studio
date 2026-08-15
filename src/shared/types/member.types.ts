import type { UserRole, MembershipStatus } from "./common.types";

export interface MemberProfileMembership {
  id: number;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  creditsRemaining: number;
  planName: string;
  planCredits: number;
}

export interface MemberProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  membership: MemberProfileMembership | null;
  classesAttended: number;
}

export interface MemberSearchResult {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
}

export interface MemberHistoryItem {
  id: number;
  planName: string;
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  creditsRemaining: number;
}

export interface MemberWithHistory {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
  createdAt: string;
  memberships: MemberHistoryItem[];
}
