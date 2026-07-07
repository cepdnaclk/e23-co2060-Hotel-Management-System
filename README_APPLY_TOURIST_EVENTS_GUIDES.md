# TourismHub LK - Tourist Events + Guides Fix

Copy these files into the same paths in your project and replace existing files.

## What is updated

- `/events` now opens the professional tourist Events & Experiences page.
- `/events/:id` opens a direct event details page if an event is not connected to an Explore place.
- Event search supports city, event name, category, venue, hotel name, and month/budget filters.
- Event View Details goes to Explore -> View Details -> Things to Do section when the event is connected to an Explore place.
- `/tourist-guides` now opens a professional guide page with search and filters.
- Home page event cards now open filtered event results.
- Backend tourist event APIs are added.
- Database `tourist_events` table and seed data are added.

## Database

Run this SQL in MySQL Workbench after your existing schema and seed data:

```sql
SOURCE path/to/database/tourist_events.sql;
```

Or open `database/tourist_events.sql`, copy all SQL, and run it in the `tourismhub_lk` database.

## Backend APIs

```text
GET /api/tourist/events
GET /api/tourist/events?search=Kandy
GET /api/tourist/events?search=Cinnamon Grand
GET /api/tourist/events/by-place/2
GET /api/tourist/events/by-place/temple-of-the-sacred-tooth-relic
GET /api/tourist/events/kandy-cultural-dance-night
```

## Run

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

Open:

```text
http://localhost:5173/events
http://localhost:5173/tourist-guides
```

## Files included

```text
client/src/App.jsx
client/src/pages/EventsPage.jsx
client/src/pages/EventDetailsPage.jsx
client/src/pages/PlaceDetailsPage.jsx
client/src/pages/TouristGuidePage.jsx
client/src/pages/HomePage.jsx
client/src/data/eventData.js
client/src/services/exploreService.js
server/src/app.js
server/src/controllers/touristEvent.controller.js
server/src/routes/touristEvent.routes.js
database/tourist_events.sql
```
