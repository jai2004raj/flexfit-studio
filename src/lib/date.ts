/**
 * Date and time domain utilities for calculations, comparisons, and ranges.
 */

/**
 * Calculates how many hours remain from now until an ISO date/time string.
 * Returns negative if the time has already passed.
 */
export function hoursUntil(iso: string, now = new Date()): number {
  return (new Date(iso).getTime() - now.getTime()) / 36e5;
}

/**
 * Adds a specific number of days to an ISO date string or Date object and returns YYYY-MM-DD.
 */
export function addDays(dateIsoOrDate: string | Date, days: number): string {
  const d = new Date(dateIsoOrDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Gets today's date formatted as YYYY-MM-DD.
 */
export function getTodayDateString(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Checks if two time intervals overlap.
 * Time strings are expected in 'HH:MM' (24-hour) format.
 */
export function isTimeRangeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Checks if two datetime ranges overlap.
 */
export function isDateTimeOverlapping(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}
