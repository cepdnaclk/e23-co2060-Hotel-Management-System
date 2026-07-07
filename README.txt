TourismHub LK - Professional Hotels Page Fix

Replace this file:
client/src/pages/HotelsPage.jsx

After replacing run:
cd client
npm install
npm run dev

Commit command:
git add client/src/pages/HotelsPage.jsx
git commit -m "improve hotels page UI and advanced filters"
git push origin dev

Notes:
- No database changes needed.
- No backend route changes needed.
- The page still uses GET /api/properties.
- This update improves UI, theme matching, search, city/district/type filters, price range, quick filters, sorting and list/grid view.
