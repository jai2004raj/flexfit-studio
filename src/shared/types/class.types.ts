import type { GymClass } from "./common.types";

export interface ClassListItem {
  id: number;
  name: string;
  description: string | null;
  room: string;
  capacity: number;
  startsAt: string;
  durationMin: number;
  creditCost: number;
  cancelled: boolean;
  trainerName: string | null;
  booked: number;
  spotsLeft: number;
  full: boolean;
}

export interface ClassWithRoster extends GymClass {
  roster: Array<{
    bookingId: number;
    status: string;
    memberName: string;
    memberEmail: string;
  }>;
}
