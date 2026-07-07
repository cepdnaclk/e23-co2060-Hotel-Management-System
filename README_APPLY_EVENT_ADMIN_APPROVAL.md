# Partner Event Admin Approval Update

This update changes partner events to work like property registration:

- Partner creates or updates an event.
- Event status becomes `pending` automatically.
- Admin reviews it from the admin panel.
- Admin can approve, reject, or remove the event.
- Only `approved` events show on the tourist Events page.
- Rejected events show the rejection reason to the partner, and the partner can edit/resubmit.

## 1. Copy files

Copy the folders/files from this package into your project root and replace existing files when asked.

## 2. Run the database migration

Open MySQL Workbench and run:

```sql
source database/migrations/2026_07_07_partner_event_admin_approval.sql;
```

Or open the file and execute all SQL manually:

```text
database/migrations/2026_07_07_partner_event_admin_approval.sql
```

## 3. Restart backend

```bash
cd server
npm install
npm run dev
```

## 4. Restart tourist/partner frontend

```bash
cd client
npm install
npm run dev
```

## 5. Restart admin frontend

```bash
cd admin-client
npm install
npm run dev
```

## 6. Test flow

### Partner side

Open:

```text
http://localhost:5173/partner/event-registration
```

Create an event. It should show as pending.

### Admin side

Open your admin frontend, normally one of these:

```text
http://localhost:5174/event-approvals
http://localhost:5175/event-approvals
http://localhost:5176/event-approvals
```

Login as admin and approve/reject the event.

### Tourist side

Open:

```text
http://localhost:5173/events
```

Only approved events should appear.

## Updated files

```text
client/src/pages/partner/PartnerEventRegistrationPage.jsx
client/src/pages/partner/PartnerDashboardPage.jsx
client/src/App.jsx

server/src/app.js
server/src/controllers/partnerEvent.controller.js
server/src/controllers/adminEvent.controller.js
server/src/controllers/touristEvent.controller.js
server/src/routes/partnerEvent.routes.js
server/src/routes/adminEvent.routes.js

admin-client/src/App.jsx
admin-client/src/pages/AdminNavbar.jsx
admin-client/src/pages/AdminDashboardPage.jsx
admin-client/src/pages/EventApprovalsPage.jsx
admin-client/src/index.css

database/migrations/2026_07_07_partner_event_admin_approval.sql
```
