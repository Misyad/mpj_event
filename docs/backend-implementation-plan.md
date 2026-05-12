# MPJ Event Backend Implementation Plan

## Current Decision

The project will use the Next.js App Router API as a backend-for-frontend layer and MySQL/MariaDB as the event database.

Local database settings are stored in `.env.local` and are intentionally ignored by git.

## Database Bootstrap

Run these SQL files in Adminer, in order:

1. `database/migrations/001_create_event_schema.sql`
2. `database/seeders/001_seed_event_demo_data.sql`

The schema covers:

- admin users and roles
- speakers
- bank accounts
- events
- event speakers
- NIAM crew identities
- public guests
- participants
- payments
- custom registration fields
- participant custom responses
- QR check-ins
- audit logs

## API Rollout Order

1. `GET /api/health/db`
2. `GET /api/events`
3. `GET /api/events/:id`
4. `POST /api/events/:id/register`
5. `GET /api/tickets/:token`
6. `POST /api/checkins/scan`
7. `POST /api/payments/:id/submit-proof`
8. `POST /api/payments/:id/verify`
9. `GET /api/admin/participants`
10. `GET /api/audit-logs`

## Important Rules

- Registration, QR validation, payment verification, and check-in decisions must be backend-authoritative.
- Frontend may show optimistic UI, but final status must come from the API.
- Duplicate registration and duplicate check-in must be rejected by the backend.
- Every important mutation should write an audit log row.

## Driver Requirement

Database-backed route handlers require the `mysql2` package:

```bash
npm.cmd install mysql2
```

If this package is not installed, `/api/health/db` returns a clear setup error instead of failing silently.

## Public Register OTP Status

- OTP email flow for public user register is prepared for a later phase.
- Current frontend flag: `NEXT_PUBLIC_USER_REGISTER_OTP_ENABLED=false`
- While this flag is `false`:
  - `/auth/user-register` does not show OTP UI
  - register submit does not call OTP endpoints
  - no OTP email is sent
  - user is redirected to `/auth/user-login` to continue with the existing login flow
- When the flag is switched to `true`, the intended flow remains:
  - biodata
  - request OTP
  - verify OTP
  - auto-login
  - redirect back to the intended public event route
