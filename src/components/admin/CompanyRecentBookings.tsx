"use client";

import { formatDateTime } from "@/lib/format";
import type { CompanyRecentBooking } from "@/shared/types/corporate.types";

interface CompanyRecentBookingsProps {
  bookings: CompanyRecentBooking[];
}

export function CompanyRecentBookings({ bookings }: CompanyRecentBookingsProps) {
  return (
    <div className="space-y-3">
      <h2 className="font-medium">Recent Corporate Bookings</h2>
      {bookings.length > 0 ? (
        <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
          {bookings.map((booking) => (
            <div key={booking.id} className="p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{booking.className}</span>
                <span className={booking.status === "attended" ? "text-green-600" : undefined}>
                  {booking.status}
                </span>
              </div>
              <div className="muted">
                {booking.memberName} · {formatDateTime(booking.startsAt)}
              </div>
              <div className="muted">Credits used: {booking.creditsUsed}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel p-4 text-center muted">No bookings yet</div>
      )}
    </div>
  );
}
