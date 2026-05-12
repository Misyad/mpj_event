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
  - `/certificate/:code`
  - `/scan`
- Registration creates an event participant and creates an internal Payment Core record for paid events:
  - `sourceType = event_registration`
  - `sourceId = participantId`
  - `paymentId = mpj_payment_core_payments.id`
- Free event participants become `confirmed` immediately.
- Paid event participants remain `registered` until payment verification.
- Payment verified listener is available at `POST /api/events/payment-verified` and marks the Payment Core record as `verified`.
- QR scan is valid only for `confirmed` participants.
- Repeated scan returns a warning path instead of silently re-checking in.
- Certificate page is available after event completion for participants with `attended` status.
- Admin create/update event now writes through the local V4-compatible event API.
- Price updates are blocked after the event is published/approved.
- Admin Event APIs now enforce Super Admin vs Admin Regional access using `scope` and `region_id`.
- Admin create/update event can persist custom registration fields to `mpj_event_custom_fields`.
- Public registration loads event custom fields and backend validation rejects missing required responses or invalid choice values.
- Admin create event can persist class options to `mpj_event_classes` for Sistem Kelas events.
- Public registration requires class selection when classes exist and backend validation rejects invalid or full classes.
- Admin event detail can read backend participants/payment records and manually confirm participants.
- Admin global participant page reads backend participant/event data and keeps filters client-side.
- Regional participant page reads backend participant/event data scoped to the regional admin session.
- Regional dashboard reads backend event and participant summaries scoped to the regional admin session.
- Regional event page has backend-scoped event data with client-side search, status/category filters, stats, and public/register actions.
- Auth redirect hardening validates `next` by role and redirects authenticated users away from login pages.
- Paymenku gateway is available as an external Payment Core provider while manual transfer remains supported.
- Admin can choose a Paymenku channel per paid event, registration creates a Paymenku transaction, and the public form returns a checkout URL.
- Paymenku credentials are stored encrypted per owner: Admin Pusat manages only the pusat credential, Admin Regional manages its own regional credential, and the pusat dashboard only shows regional setup status without secrets.
- Paymenku webhook is available at `POST /api/paymenku/webhook` and verifies `X-Paymenku-Signature` plus `X-Paymenku-Timestamp` before confirming participants.
- AI chatbot is available as a floating read-only operational assistant for public and admin surfaces. It can answer MPJ Event FAQ, summarize visible event data, and help check ticket/payment/attendance context without mutating records.

## Remaining Integration Work

- Add production operational monitoring for failed/late Paymenku webhooks if needed.

## Key Endpoints

- `GET /api/events`
- `GET /api/events/:idOrSlug`
- `POST /api/events/:idOrSlug/register`
- `POST /api/events/payment-verified`
- `POST /api/tickets/verify`
- `POST /api/tickets/check-in`
- `GET /api/admin/events`
- `POST /api/admin/events`
- `GET /api/admin/events/:idOrSlug`
- `PATCH /api/admin/events/:idOrSlug`
- `POST /api/admin/events/:idOrSlug/participants/:participantId/confirm`
- `GET /api/admin/participants`
- `GET /api/regional/participants`
- `GET /api/paymenku/channels`
- `POST /api/paymenku/webhook`
- `POST /api/paymenku/status/:id`
- `POST /api/ai/chat`
