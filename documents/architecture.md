# FlexFit Studio — System Architecture & Design

## 1. Overview

FlexFit Studio is a gym and studio class management application built on modern Next.js 15 App Router, TypeScript, tRPC, Drizzle ORM, and SQLite. The application serves three distinct user roles:
- **Members**: Book classes, manage subscriptions, track credits, join waitlists, and reschedule classes.
- **Staff & Trainers**: Manage trainer availability, view rosters, track attendance, and run kiosk check-ins.
- **Admins**: Monitor studio statistics, class utilisation, revenue analytics, membership expiry, and corporate credit pools.

---

## 2. Architecture Comparison: Before vs After

### Before Refactoring
```
[Client UI Pages]
       │
       ▼ (Direct RPC calls)
[Monolithic tRPC Routers]
  ├── Inline Zod Input Schemas
  ├── Session/Auth Middlewares
  ├── Critical Domain Business Logic
  │     ├── Cancellation windows (12h/24h)
  │     ├── Reschedule validity rules (4h)
  │     ├── Waitlist auto-promotion logic
  │     └── Corporate credit pool math
  ├── Direct Database Queries (Raw SQL / Drizzle)
  └── Response formatting & mapping
```

**Key Deficiencies in Previous Architecture:**
1. **Tight Coupling**: Business logic could not be tested or reused outside of the tRPC router execution context.
2. **Duplication**: Date math (`hoursUntil`), membership retrieval (`activeMembershipFor`), validation logic, and credit handling were duplicated across multiple router files.
3. **Weak Type Safety**: Multiple frontend pages relied on `any` types for query results and component state.
4. **Zero Automated Tests**: No automated regression test suite existed for critical studio operations.

---

### After Refactoring (Modular Layered Architecture)

```
┌──────────────────────────────────────────────────────────┐
│                   Next.js 15 App Router                  │
│       (Server & Client Components, Modular Subcomponents)│
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                   tRPC API Layer                         │
│             (Thin Controllers & Middlewares)             │
│   src/server/routers/*.ts & src/shared/schemas/*.ts      │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                 Domain Services Layer                    │
│   src/server/services/*.ts (Pure Business Logic & Rules)  │
│   - BookingService        - CorporateService             │
│   - RescheduleService     - TrainerService               │
│   - MemberService         - StatsService                 │
│   - PlanService           - PaymentService               │
│   - AuthService           - NotificationService          │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│            Data Access & Schema Layer                    │
│   src/db/schema.ts & src/db/index.ts (Drizzle ORM)       │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                     SQLite Database                      │
│                      (flexfit.db)                        │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Directory Layout & Module Responsibilities

```
flexfit-studio/
├── documents/                    # Architectural decisions, business notes, and known issues
│   ├── architecture.md
│   ├── refactoring-decisions.md
│   ├── behavior-notes.md
│   └── known-issues.md
├── src/
│   ├── app/                      # Next.js 15 App Router pages & API route handlers
│   │   ├── admin/                # Admin dashboards, attendance, reports, corporate companies
│   │   ├── api/trpc/[trpc]/      # tRPC HTTP fetch request adapter
│   │   ├── dashboard/            # Member booking dashboard & history
│   │   ├── kiosk/                # Front-desk check-in kiosk
│   │   ├── login/                # Authentication page
│   │   ├── notifications/        # Notification inbox
│   │   ├── plans/                # Membership plan catalog
│   │   ├── schedule/             # Class schedule & booking UI
│   │   ├── trainer/schedule/     # Trainer schedule & availability manager
│   │   └── waitlist/             # Member waitlist status & queue position
│   ├── components/               # UI presentation layer
│   │   ├── admin/                # Decomposed Admin components (TopUp, MemberLinker, etc.)
│   │   ├── kiosk/                # Kiosk lookup & upcoming classes components
│   │   ├── NavBar.tsx            # Global role-aware header navigation
│   │   └── reschedule-modal.tsx  # Class reschedule modal
│   ├── config/
│   │   └── constants.ts          # Studio-wide domain constants (cancellation windows, credits)
│   ├── db/
│   │   ├── index.ts              # LibSQL client & Drizzle database instance
│   │   ├── schema.ts             # Drizzle tables & entity types
│   │   └── seed.ts               # Studio seed script
│   ├── lib/
│   │   ├── date.ts               # Pure date calculations (hoursUntil, addDays, overlaps)
│   │   ├── format.ts             # Display formatting (currency, timestamps, dates)
│   │   ├── password.ts           # Crypto password hashing and verification
│   │   └── trpc.ts               # React Query tRPC client setup
│   ├── server/
│   │   ├── routers/              # Thin tRPC controllers validating schemas & invoking services
│   │   ├── services/             # Dedicated domain service classes encapsulating business logic
│   │   └── trpc.ts               # tRPC context, router initialization, procedure middlewares
│   └── shared/
│       ├── schemas/              # Centralized Zod validation schemas
│       └── types/                # Domain types, DTOs, and discriminated unions
└── tests/
    ├── helpers/test-db.ts        # In-memory SQLite database setup for test isolation
    └── unit/                     # Comprehensive Vitest unit & integration test suites
```

---

## 4. Key Architectural Patterns

1. **Thin Controllers (tRPC Routers)**:
   - Routers only handle input validation through shared Zod schemas, procedure authorization (`publicProcedure`, `protectedProcedure`, `staffProcedure`, `adminProcedure`), and delegating to services.
2. **Domain Service Pattern**:
   - Every business capability (`BookingService`, `CorporateService`, `RescheduleService`, etc.) is encapsulated in a dedicated service with static or injectable database instances.
   - Services are 100% decoupled from HTTP/RPC transport layers and can be tested in isolation.
3. **Single Source of Truth for Schemas and Types**:
   - Validation schemas in `src/shared/schemas/` are shared between client and server.
   - Types are strongly derived and typed with zero `any` usage.
4. **Complete UI Preservation**:
   - Component extraction preserves the exact class names, CSS variable bindings, and DOM structures so visual aesthetics and styling remain identical.
