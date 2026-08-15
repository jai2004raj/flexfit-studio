# FlexFit Studio — Refactoring Decisions & Rationale

This document explains the key architectural and engineering decisions made during the refactoring of FlexFit Studio.

---

## 1. Separation of Domain Services from tRPC Routers

### Context
In the original codebase, tRPC routers were monolithic blocks containing 100-400 lines of mixed code per file: input validation, permission checks, database queries, business rules (e.g. waitlist auto-promotion, credit calculations), and response formatting.

### Decision
Extract all business rules and database mutations into dedicated domain service classes under `src/server/services/`:
- `BookingService`
- `CorporateService`
- `RescheduleService`
- `ClassService`
- `TrainerService`
- `MemberService`
- `PlanService`
- `PaymentService`
- `NotificationService`
- `StatsService`
- `AuthService`

### Trade-offs & Benefits
- **Benefit: High Testability**: Core logic (e.g. 12-hour cancellation refunds, waitlist promotion, corporate pool balance changes) can be tested directly using clean unit tests with isolated database instances without requiring mock tRPC contexts.
- **Benefit: Single Responsibility**: Routers focus strictly on routing, procedure protection, and schema validation. Services focus strictly on domain business rules and data consistency.
- **Trade-off**: Slightly more files, but substantially higher maintainability and clarity.

---

## 2. Centralization of Validation Schemas & Types

### Context
Input validation schemas were defined as inline anonymous Zod objects inside router procedures. Several frontend pages lacked TypeScript interfaces, using `any` for member lookups, company data, and corporate bookings.

### Decision
1. Create `src/shared/schemas/` containing dedicated Zod validation schemas for every domain module.
2. Create `src/shared/types/` defining domain interfaces, DTOs, and discriminated union results.
3. Replace all `any` usages in frontend pages (`kiosk/page.tsx`, `admin/companies/[id]/page.tsx`) with strongly typed interfaces.

### Benefits
- Enables input validation schema reuse between frontend forms and server endpoints.
- Guarantees end-to-end type safety with zero `any` loopholes.
- Autocompletion and refactoring safety across both client and server code.

---

## 3. Extraction of Centralized Constants and Date Utilities

### Context
Magic numbers and repeated logic were scattered across files:
- `hoursUntil` was defined 3 times independently (`bookings.ts`, `corporate-bookings.ts`, `reschedules.ts`).
- `UNLIMITED_CREDITS = 999` was hardcoded across server routers and client pages (`dashboard/page.tsx`, `plans/page.tsx`).
- Cancellation thresholds (`FREE_CANCELLATION_HOURS = 12`, `CORPORATE_FREE_CANCELLATION_HOURS = 24`, `FREE_RESCHEDULE_HOURS = 4`) were defined as local constants in separate routers.

### Decision
1. Create `src/config/constants.ts` for studio-wide constants (`FREE_CANCELLATION_HOURS`, `CORPORATE_FREE_CANCELLATION_HOURS`, `FREE_RESCHEDULE_HOURS`, `UNLIMITED_CREDITS`, `SESSION_DAYS`, `SESSION_COOKIE`).
2. Create `src/lib/date.ts` for pure date and time calculations (`hoursUntil`, `addDays`, `getTodayDateString`, `isTimeRangeOverlapping`, `isDateTimeOverlapping`).

### Benefits
- Single Source of Truth: Modifying a business rule (e.g. extending free cancellation to 18 hours or unlimited credit threshold) requires changing one constant in one file.
- Prevents subtle date math bugs and ensures consistent timezone handling across all features.

---

## 4. UI Component Decomposition with 100% Visual Preservation

### Context
Complex admin and kiosk pages (`admin/companies/[id]/page.tsx`, `admin/companies/page.tsx`) exceeded 250 lines and contained multiple nested modal forms, search lists, and complex local state.

### Decision
Decompose large page components into focused, reusable components:
- `CompanyTopUpForm`: Extracted credit pool top-up form.
- `CompanyMemberLinker`: Extracted member search and company linking form.
- `CompanyRecentBookings`: Extracted corporate booking history viewer.
- `CreateCompanyForm`: Extracted company creation form.

### Preserving Visual Fidelity
All extracted components retain the exact same HTML element hierarchy, Tailwind utility classes, inline style overrides, CSS custom variables (`var(--bg)`, `var(--panel)`, `var(--accent)`, `var(--border)`), and interactive behaviors.

---

## 5. Automated Regression Test Suite with Isolated SQLite Instances

### Context
The repository had Vitest configured in `package.json` but contained zero test files.

### Decision
Implement comprehensive unit and integration tests under `tests/unit/`:
- `tests/helpers/test-db.ts`: In-memory / temporary file SQLite client with schema setup and cleanup.
- Tests covering all critical domain rules:
  - `booking.service.test.ts`: Capacity check, waitlisting, credit deduction, 12h refund rule, waitlist promotion.
  - `reschedule.service.test.ts`: 4h deadline rule, same class name rule, target class waitlisting.
  - `corporate.service.test.ts`: Credit pool deduction, 24h refund window, top-up balance math.
  - `trainer.service.test.ts`: Availability setup and collision detection.
  - `stats.service.test.ts`: Revenue, check-ins, active memberships aggregation.
  - `auth.service.test.ts`: Login, password verification, registration, duplicate checks, account deactivation.
  - `plan-payment.service.test.ts`: Subscription payment creation, refund cancellation.
  - `date-utils.test.ts`: Date math, day increments, overlap detection.

### Benefits
- 100% automated regression protection ensuring future modifications do not break core gym business rules.
