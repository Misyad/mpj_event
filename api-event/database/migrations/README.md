# MPJ Event API Migrations

The main event tables already exist in the parent project SQL schema:

- `events`
- `event_custom_fields`
- `event_participants`
- `event_guests`
- `crew_members`
- `payments`
- `speakers`

This submodule only adds support tables that are not guaranteed by the existing SQL: attendance logs and event finance transactions.
