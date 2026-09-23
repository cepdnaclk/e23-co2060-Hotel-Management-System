# Complete Guide Process

This build completes the TourismHub LK guide workflow and organizes partner request management per guide profile.

## Partner flow

1. Partner creates one or more guide profiles.
2. Partner pays the registration fee for each profile.
3. Admin approves the guide profile.
4. Approved guides can optionally purchase the 30-day top-listing promotion.
5. The Partner Dashboard keeps the three main registration tasks only: Property, Event, and Guider Registration.
6. In **My Guiders**, every approved/paid guide has its own **Manage Requests** button.
7. Clicking that button opens `/partner/guides/:guideId/requests` and shows only requests that belong to that specific guide.
8. The partner can accept/reject pending requests, see payment status, contact the tourist, and mark paid trips completed.

## Tourist flow

1. Tourist searches public guides and opens a guide profile.
2. Tourist submits a full-day or hourly booking request.
3. Request is saved in MySQL as `pending`.
4. The relevant guide's partner accepts or rejects it.
5. Accepted requests become payable in **My Guide Bookings**.
6. Demo payment is stored in MySQL and the booking becomes `confirmed`.
7. After the partner marks the trip `completed`, the tourist can leave one verified review.

## Guide-specific request URLs

Frontend:

- `/partner/guides/:guideId/requests`

API:

- `GET /api/partner/guide-bookings/:guideId`
- `PATCH /api/partner/guide-bookings/:guideId/:bookingId/status`

The API verifies that the requested guide belongs to the logged-in partner before returning or updating bookings.

## Existing database compatibility

The backend now calls `ensureGuideProcessSchema()` before guide-booking/review operations. If an older development database does not yet have `guide_bookings`, `guide_booking_payments`, or `guide_reviews`, those tables are created automatically without deleting existing data.

You can still run the migration manually from `server/` if you want the indexes from the migration file:

```bash
npm run migrate:guide-process
```

## Backward compatibility

The old frontend route `/partner/guide-bookings` now redirects to `/partner/guides`, so partners choose the relevant guide first rather than managing all guide requests from a global dashboard card.
