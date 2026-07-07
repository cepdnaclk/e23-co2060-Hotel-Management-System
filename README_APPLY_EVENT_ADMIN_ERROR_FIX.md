# Event Admin Approval Server Error Fix

This fixes the orange error:

`Server error while loading event approval requests`

## Why it happens

The admin frontend is calling:

`GET /api/admin/events?status=all`

The backend route exists, but the database table `tourist_events` does not yet have all approval columns used by the new admin code.

Usually missing columns are:

- partner_id
- property_id
- event_date
- contact_name
- contact_phone
- contact_email
- rejection_reason
- submitted_at
- approved_at
- approved_by

## Apply

1. Copy the files into your project root.
2. Run this SQL in MySQL Workbench:

`database/migrations/2026_07_07_partner_event_admin_approval_FIX.sql`

3. Restart backend:

```bash
cd server
npm run dev
```

4. Restart admin frontend:

```bash
cd admin-client
npm run dev
```

5. Open:

`http://localhost:5174/dashboard`

Then click **Event Approvals**.
