# TripLanka Server Automated Testing

This test suite uses Node.js' built-in `node:test` runner. No Jest or Supertest dependency is required.

## Test coverage by module

- `auth.test.js` — registration validation, password security, login, JWT, profile, auth/role middleware
- `property.test.js` — property registration, plan limits, room creation, admin approve/reject
- `booking.test.js` — tourist/guest hotel booking, date/capacity/availability checks, pricing, partner approval/rejection, payment
- `guideBooking.test.js` — guide registration/payment/promotion, guide booking, conflicts, payment, cancellation/refund, reviews
- `events.test.js` — partner event creation/ownership/status, admin approval/rejection
- `eventReports.test.js` — reporting, moderation, visibility, transitions, rollback, pagination and authorization
- `reception.test.js` — reception login, room availability, walk-in booking, status transitions and payment status
- `tripPlanner.test.js` — trip ownership, validation, limits, settings, guest sessions, source validation, list/delete
- `localImages.test.js` — local catalogue image path resolution and server image delivery

## Requirements

- Node.js 20 or newer (Node 22 LTS recommended)
- Run `npm install` in `server/`
- These controller tests use in-memory/mock database adapters. They do not modify your real MySQL database.

## Commands

Run the complete server suite:

```bash
npm test
```

Run with Node's built-in coverage report:

```bash
npm run test:coverage
```

Run one module only:

```bash
npm run test:auth
npm run test:properties
npm run test:bookings
npm run test:guides
npm run test:events
npm run test:reception
npm run test:trip-planner
npm run test:images
```

The existing event-report-only command is kept:

```bash
npm run test:reports
```

## Verified result for this project snapshot

The complete suite was executed against this project snapshot on Node 22.16.0:

- Tests: 72
- Passed: 72
- Failed: 0
- Cancelled: 0
- Skipped: 0

The built-in coverage report also completed successfully. Coverage percentages will change whenever application code or tests change, so use the figures produced by your own final run in presentation slides.
