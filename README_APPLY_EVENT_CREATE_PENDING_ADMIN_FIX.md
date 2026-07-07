# Partner Event Create + Pending Admin Approval Fix

This update fixes the issue where clicking **Create Event** does not add the event to partner dashboard/admin approvals.

## Why the issue happened

Your backend was still using `explore_places` joins in the partner/tourist event APIs. If your local database does not have `explore_places`, the event API fails. Sometimes the form appears to do nothing because the backend returns an error.

This fix removes the required `explore_places` dependency from event creation and adds a safe database migration for the pending/approved/rejected flow.

## Files to copy

Copy these folders/files into your project root and replace existing files:

- `server/src/controllers/partnerEvent.controller.js`
- `server/src/controllers/touristEvent.controller.js`
- `server/src/controllers/adminEvent.controller.js`
- `server/src/routes/partnerEvent.routes.js`
- `server/src/routes/adminEvent.routes.js`
- `server/src/app.js`
- `client/src/pages/partner/PartnerEventRegistrationPage.jsx`
- `client/src/pages/partner/PartnerDashboardPage.jsx`
- `client/src/App.jsx`
- `admin-client/src/App.jsx`
- `admin-client/src/pages/EventApprovalsPage.jsx`
- `admin-client/src/pages/AdminDashboardPage.jsx`
- `admin-client/src/pages/AdminNavbar.jsx`
- `admin-client/src/index.css`
- `database/migrations/2026_07_08_event_create_pending_admin_FIX.sql`

## Run SQL

In MySQL Workbench, run only this file:

```sql
USE tourismhub_lk;
-- then run all code from:
-- database/migrations/2026_07_08_event_create_pending_admin_FIX.sql
```

Do not run the old `database/tourist_events.sql` file for this fix.

## Restart

Backend:

```bash
cd server
npm run dev
```

Partner/tourist frontend:

```bash
cd client
npm run dev
```

Admin frontend:

```bash
cd admin-client
npm run dev
```

## Test

1. Login as partner.
2. Open `/partner/event-registration`.
3. Fill required fields and click **Create Event**.
4. It should show success message: `Event created successfully. It is now pending admin approval.`
5. Open partner dashboard. The event should show as `pending`.
6. Login as admin and open `/event-approvals`.
7. Approve the event.
8. The event becomes visible on tourist `/events` page.

## Quick database check

```sql
USE tourismhub_lk;
SELECT id, title, partner_id, status, submitted_at FROM tourist_events ORDER BY id DESC;
```
