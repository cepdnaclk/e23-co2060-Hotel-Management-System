# Partner Guider Section - Apply Steps

Copy these files into your project keeping the same folder paths.

## 1) Run database migration
In MySQL Workbench, run:

```sql
USE tourismhub_lk;
SOURCE database/migrations/2026_07_08_partner_guides.sql;
```

Or open `database/migrations/2026_07_08_partner_guides.sql` and run it manually.

## 2) Backend files added/updated
- `server/src/controllers/partnerGuide.controller.js`
- `server/src/controllers/publicGuide.controller.js`
- `server/src/controllers/adminGuide.controller.js`
- `server/src/routes/partnerGuide.routes.js`
- `server/src/routes/publicGuide.routes.js`
- `server/src/routes/adminGuide.routes.js`
- `server/src/app.js`

New API routes:
- Partner: `/api/partner/guides`
- Public tourist page: `/api/guides`
- Admin approval: `/api/admin/guides`

## 3) Client files added/updated
- `client/src/pages/partner/PartnerGuideRegistrationPage.jsx`
- `client/src/pages/partner/PartnerDashboardPage.jsx`
- `client/src/pages/TouristGuidePage.jsx`
- `client/src/App.jsx`

New partner page:
- `/partner/guides`

## 4) Admin client files added/updated
- `admin-client/src/pages/GuideApprovalsPage.jsx`
- `admin-client/src/pages/AdminNavbar.jsx`
- `admin-client/src/App.jsx`
- `admin-client/src/index.css`

New admin page:
- `/guide-approvals`

## 5) Test flow
1. Login as partner.
2. Open Partner Dashboard.
3. Click Guider Registration.
4. Add profile and submit.
5. Login as admin.
6. Open Guide Approvals.
7. Approve the profile.
8. Open public `/tourist-guides` page and check the approved guide.
