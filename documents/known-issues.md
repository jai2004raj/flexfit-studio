# FlexFit Studio — Known Issues, Observations & Invariants

This document catalogs observed edge cases, intentional business invariants, and future recommendations for the FlexFit Studio codebase.

---

## 1. Preserved Domain Invariants

1. **Unlimited Credits Value (`999`)**:
   - The application represents unlimited classes using credit counts `>= 999`. This is an established domain invariant across existing seeded plans (e.g. "Monthly Unlimited", "Annual VIP").
   - **Resolution**: Centralized into `UNLIMITED_CREDITS` in `src/config/constants.ts` so all service logic and UI display components reference a single constant.

2. **Differentiated Cancellation Windows (12h vs 24h vs 4h)**:
   - Individual member cancellations require 12 hours notice (`FREE_CANCELLATION_HOURS = 12`).
   - Corporate credit pool cancellations require 24 hours notice (`CORPORATE_FREE_CANCELLATION_HOURS = 24`).
   - Class reschedules require only 4 hours notice (`FREE_RESCHEDULE_HOURS = 4`).
   - **Resolution**: All 3 windows are preserved and documented in `src/config/constants.ts` and `documents/behavior-notes.md`.

3. **Waitlist Auto-Promotion Credit Invariant**:
   - When a user on the waitlist is promoted to a confirmed booking upon another member's cancellation, the system requires sufficient credits remaining on the promoted user's membership. If the promoted user's credits have dropped to 0 in the interim, the promotion still occurs but logs the condition.

---

## 2. Technical Observations & Recommendations

1. **Database Transactions in SQLite**:
   - For high concurrency production environments with concurrent cancellations and bookings, wrapping multi-step booking and waitlist promotions inside strict database transactions (`db.transaction(...)`) is recommended if migrating from SQLite to PostgreSQL.
2. **Session Expiration Cleanup**:
   - Sessions older than `SESSION_DAYS = 7` expire naturally based on `expiresAt`. A periodic cron job to prune expired session tokens from the `sessions` table would prevent database table bloat over time.
3. **Notification Channels**:
   - Notifications are currently stored in the internal SQLite table and polled via tRPC query with a 30-second interval (`refetchInterval: 30000`). Future extensions could add WebSockets (Server-Sent Events) or email/SMS webhooks for instant waitlist promotion alerts.
