# Partner Dashboard + Event Registration Update

Copy these files into the project root. Replace existing files when asked.

## Frontend files

- `client/src/App.jsx`
- `client/src/pages/partner/PartnerDashboardPage.jsx`
- `client/src/pages/partner/PartnerEventRegistrationPage.jsx`

## Backend files

- `server/src/app.js`
- `server/src/controllers/partnerEvent.controller.js`
- `server/src/routes/partnerEvent.routes.js`

## Database files

- `database/migrations/2026_07_07_partner_events_dashboard.sql`
- `database/tourist_events.sql`

## Run database update

Open MySQL Workbench and run:

```sql
USE tourismhub_lk;
SOURCE database/migrations/2026_07_07_partner_events_dashboard.sql;
```

If SOURCE does not work in your Workbench, open the SQL file and run the full script.

## Start backend

```bash
cd server
npm install
npm run dev
```

## Start frontend

```bash
cd client
npm install
npm run dev
```

## Main routes

- Partner login: `/partner/login`
- Professional partner dashboard: `/partner/dashboard`
- Property registration: `/partner/register-property`
- Event registration/editing: `/partner/event-registration`

## What partners can do

- After partner login, they see a professional dashboard.
- Dashboard has two main buttons: Property Registration and Event Registration.
- Property Registration uses your existing property registration page.
- Event Registration opens a separate event form.
- Partners can create, edit, publish, hide, draft, and delete their own events.
- Published events appear on the tourist Events page.
