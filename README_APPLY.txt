Explore Location Final Fix
==========================

Replace this file:
admin-client/src/pages/ExploreManagerPage.jsx

What changed:
- Location helper no longer depends only on one weak online map query.
- It now tries multiple cleaner queries automatically.
- It also includes trusted local Sri Lanka suggestions for common places such as Anuradhapura, Sigiriya, Dambulla, Kandy, Ella, Mirissa, Galle, Yala, Trincomalee and others.
- Selecting a result updates only latitude and longitude. Other typed form changes stay safe.
- No database change is needed.

After replacing run:
cd admin-client
npm run dev
