export interface TrainerUpcomingClass {
  id: number;
  name: string;
  room: string;
  startsAt: string;
  durationMin: number;
  cancelled: boolean;
}

export interface TrainerAvailabilityCheckResult {
  available: boolean;
  reason?: string;
}
