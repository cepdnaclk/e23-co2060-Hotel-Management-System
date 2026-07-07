Explore location map fix

Replace these files:

admin-client/src/pages/ExploreManagerPage.jsx
client/src/pages/PlaceDetailsPage.jsx

What changed:
- Admin Explore Manager has a new Map Location section.
- Admin can search Sri Lanka locations using OpenStreetMap search.
- Admin can pick a search result and latitude/longitude fill automatically.
- Admin can manually fine tune latitude and longitude.
- Place details page shows a Location Map card when coordinates exist.
- Quick info card shows an Open Map button when coordinates exist.

No database change is needed because explore_places already has lat and lng columns.

After replacing:
cd admin-client
npm run dev

cd client
npm run dev
