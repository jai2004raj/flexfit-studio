# FlexFit Studio — Domain Behavior & Business Rules

This document records the exact business rules, invariants, and policies discovered in the FlexFit Studio codebase.

---

## 1. Class Booking & Capacity Rules

1. **Active Membership Prerequisite**:
   - A member must have an active membership with an `endDate >= today` to book regular classes.
2. **Credit Cost & Deduction**:
   - Each class specifies a `creditCost` (default is 1 credit).
   - If a member has a limited credit plan (`creditsRemaining < 999`), booking a confirmed spot immediately deducts `creditCost` from `creditsRemaining`.
   - If a member has an unlimited credit plan (`creditsRemaining >= 999`), credits are never decremented.
3. **Capacity & Waitlisting**:
   - When confirmed bookings (`status = 'booked'`) for a class equal or exceed `capacity`, new bookings are placed on the waitlist with `status = 'waitlisted'` and `creditsUsed = 0`.
   - A member on the waitlist is not charged credits until they are promoted to a confirmed spot.
   - Waitlist order is strictly first-come, first-served based on `bookedAt ASC`.
4. **Duplicate Booking Prevention**:
   - A user cannot book or waitlist for the same class if they already hold an active booking (`status in ('booked', 'waitlisted')`).
5. **Class State Checks**:
   - Classes that are `cancelled = true` or have already started (`startsAt <= now`) cannot be booked or rescheduled to.

---

## 2. Cancellation & Refund Policy

1. **Individual Member Bookings**:
   - **Free Cancellation Window**: Up to **12 hours** before class start time (`FREE_CANCELLATION_HOURS = 12`).
   - **Refund Behavior**:
     - If cancelled `>= 12 hours` before start and `creditsUsed > 0`, the credits are refunded back to the member's active membership (unless unlimited).
     - If cancelled `< 12 hours` before start, the spot is freed but the credits are forfeited (`refunded: false`).
2. **Waitlist Auto-Promotion**:
   - When a confirmed booking (`status = 'booked'`) is cancelled, the system automatically checks for the earliest waitlisted member (`status = 'waitlisted'` ordered by `bookedAt ASC`).
   - The first waitlisted member is promoted to `status = 'booked'` with `creditsUsed = creditCost`.
   - If the promoted member has a limited membership, `creditCost` is deducted from their remaining credits.
3. **Corporate Member Bookings**:
   - **Corporate Free Cancellation Window**: Up to **24 hours** before class start time (`CORPORATE_FREE_CANCELLATION_HOURS = 24`).
   - If cancelled `>= 24 hours` before start, the credits used are refunded back to the company's `creditPoolBalance`.
   - If cancelled `< 24 hours` before start, credits are forfeited.
   - Waitlist auto-promotion also operates for corporate bookings, deducting credits from the promoted member's company pool if balance allows.

---

## 3. Rescheduling Policy

1. **Reschedule Window**:
   - Members can reschedule up to **4 hours** before the original class start time (`FREE_RESCHEDULE_HOURS = 4`).
   - This is intentionally more generous than the 12-hour cancellation policy to encourage attendance.
2. **Same Class Name Rule**:
   - Members may only reschedule to another session of the **exact same class name** (e.g. "Vinyasa Yoga" to another "Vinyasa Yoga").
3. **Credit Transfer**:
   - Rescheduling does not charge additional credits. The credits already consumed by the original booking transfer directly to the new booking.
4. **Full Target Class Behavior**:
   - If the target class is full, the reschedule creates a waitlisted booking for the target class and cancels the original booking.
5. **Audit Trail**:
   - Every reschedule is recorded in the `reschedules` table linking `fromBookingId`, `toBookingId`, `fromClassId`, and `toClassId`.

---

## 4. Corporate Memberships & Credit Pools

1. **Company Credit Pool**:
   - Companies purchase a pool of shared class credits (`creditPoolBalance`).
   - Linked employees book against this pool instead of needing personal memberships.
2. **Employee Linking**:
   - Admins can link/unlink users with the `member` role to an active company.
   - Only active companies can be used to book corporate spots.
3. **Credit Deductions & Top-Ups**:
   - Booking a corporate class requires `creditPoolBalance >= creditCost`.
   - Admins can top up credit pools at any time with any positive integer amount.

---

## 5. Trainer Availability & Collision Detection

1. **Availability Schedules**:
   - Trainers set recurring weekly availability intervals for days of the week (0 = Sunday to 6 = Saturday) with `startTime` and `endTime` (HH:MM format).
2. **Class Scheduling Conflict Checks**:
   - Classes assigned to a trainer must fall within the trainer's availability window for that day of the week.
   - The system checks for time overlap against all existing uncancelled classes assigned to that trainer to prevent double-booking.

---

## 6. Financial & Membership Lifecycle

1. **Plans & Subscriptions**:
   - Subscribing to a plan immediately activates a membership for `durationDays` and records a payment with status `paid`.
2. **Payment Refunds**:
   - Admins can refund paid payments. Refunding a payment automatically cancels the associated membership (`status = 'cancelled'`).
