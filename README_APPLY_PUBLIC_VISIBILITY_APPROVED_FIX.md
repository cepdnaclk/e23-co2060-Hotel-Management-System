# Public visibility fix for approved properties and events

This update fixes the issue where admin-approved properties/events do not appear on the tourist Hotels page or Events page.

## Updated behavior

- Admin approves property -> property appears on `/hotels` and can be searched by hotel name, city, district, type, address, or description.
- Admin approves event -> event appears on `/events` and can be searched by event title, city, hotel name/nearby hotels, category, venue, or highlights.
- Pending/rejected/hidden events do not appear publicly.
- Pending/rejected properties do not appear publicly.

## Files included

```text
server/src/controllers/property.controller.js
server/src/controllers/touristEvent.controller.js
server/src/controllers/admin.controller.js
client/src/pages/HotelsPage.jsx
client/src/pages/EventsPage.jsx
database/migrations/2026_07_08_public_approved_visibility_FIX.sql
```

## Apply steps

1. Copy these files into your project root and replace existing files.
2. Run this SQL file in MySQL Workbench:

```text
database/migrations/2026_07_08_public_approved_visibility_FIX.sql
```

Select the full SQL file and run it together because it temporarily disables safe update mode.

3. Restart backend:

```bash
cd server
npm run dev
```

4. Restart client:

```bash
cd client
npm run dev
```

5. Test:

```sql
USE tourismhub_lk;

SELECT id, name, city, status, is_verified
FROM properties
WHERE status = 'approved'
ORDER BY id DESC;

SELECT id, title, city, status, approved_at
FROM tourist_events
WHERE status = 'approved'
ORDER BY id DESC;
```

Then open:

```text
http://localhost:5173/hotels
http://localhost:5173/events
```

## Commit message

```bash
git commit -m "Fix public visibility for approved hotels and events"
```
