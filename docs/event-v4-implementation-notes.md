# Event V4 Implementation Notes

## Implemented

- Added V4-compatible fields to the existing `mpj_event_events` table through additive schema guards.
- Added V4-compatible participant fields to `mpj_event_participants`.
- Added `mpj_event_classes` and `mpj_event_custom_fields` tables for the optional class and custom field model.
- Public event listing now reads published/public event data from `mpj_event_events`.
- Event detail can resolve by `id` or `slug`.
- Portal routes now support:
  - `/`
  - `/:slug`
  - `/register/:slug`
  - `/ticket/:code`
  - `/scan`
- Registration creates an event participant and returns a Payment Core request contract for paid events:
  - `sourceType = event_registration`
  - `sourceId = participantId`
- Free event participants become `confirmed` immediately.
- Paid event participants remain `registered` until payment verification.
- Payment verified listener is available at `POST /api/events/payment-verified`.
- QR scan is valid only for `confirmed` participants.
- Repeated scan returns a warning path instead of silently re-checking in.
- Admin create/update event now writes through the local V4-compatible event API.
- Price updates are blocked after the event is published/approved.

## Remaining Integration Work

- Wire the real Payment Core service endpoint when its API contract is finalized.
- Replace the temporary `payment_core_not_configured` response with a real Payment Core create-payment call.
- Build the admin custom field editor persistence UI.
- Build event class selection and class quota UI.
- Add role enforcement for Admin Pusat vs Admin Regional using `scope` and `region_id`.
- Add certificate generation after event completion.

## Key Endpoints

- `GET /api/events`
- `GET /api/events/:idOrSlug`
- `POST /api/events/:idOrSlug/register`
- `POST /api/events/payment-verified`
- `POST /api/tickets/verify`
- `POST /api/tickets/check-in`
- `GET /api/admin/events`
- `POST /api/admin/events`
- `PATCH /api/admin/events/:idOrSlug`
