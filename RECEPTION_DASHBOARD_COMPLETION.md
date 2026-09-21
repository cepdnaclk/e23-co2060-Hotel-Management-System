# Reception Dashboard Completion

This update completes the reception module and moves it into its own frontend application so reception staff do not use the tourist/partner site or the administrator site.

## Frontend Separation

The project now has three independent React/Vite frontends:

- `client/` - public, tourist, and hotel-partner site (`http://localhost:5173`)
- `admin-client/` - administrator site (`http://localhost:5174`)
- `reception-client/` - hotel reception site (`http://localhost:5175`)

The old reception routes were removed from `client/`.

## Reception URLs

When `reception-client` is running:

- `/login` - reception sign-in
- `/dashboard` - property-scoped reception dashboard

Local URLs:

- `http://localhost:5175/login`
- `http://localhost:5175/dashboard`

Reception staff sign in with the hotel partner email and the property management password created for that property. The backend returns a dedicated JWT with role `reception` and the matched `property_id`.

## Completed Functions

- Completely separate reception frontend application
- Separate reception authentication token/local-storage namespace
- Property-scoped access (the token contains the matched `property_id`)
- Front desk overview with room, arrival, departure, in-house and pending-booking counts
- Room-type inventory and manual availability correction
- Walk-in guest registration and booking
- Cash/card reception payment recording
- Reception-created booking references beginning with `THLK-R-`
- Online/reception booking list with search and status filters
- Approve/reject pending online reservations
- Check-in and check-out workflow
- Supported cancellation workflow
- Automatic room availability decrement/restoration for booking lifecycle actions
- Payment status update from reception
- Guest directory generated from property booking records
- Responsive reception UI

## Backend Endpoints

All protected endpoints below require a valid reception token.

- `POST /api/reception/login`
- `GET /api/reception/property`
- `GET /api/reception/bookings`
- `POST /api/reception/bookings`
- `PATCH /api/reception/bookings/:bookingId/status`
- `PATCH /api/reception/bookings/:bookingId/payment`
- `PATCH /api/reception/rooms/:roomId/availability`

## Booking Status Actions

`PATCH /api/reception/bookings/:bookingId/status`

```json
{ "action": "approve" }
```

Supported actions:

- `approve`
- `reject`
- `check_in`
- `check_out`
- `cancel`

For `reject` and `cancel`, an optional `note` can also be sent.

## Main Files Added/Updated

- `reception-client/package.json`
- `reception-client/index.html`
- `reception-client/vercel.json`
- `reception-client/.env.example`
- `reception-client/src/App.jsx`
- `reception-client/src/main.jsx`
- `reception-client/src/index.css`
- `reception-client/src/api/api.js`
- `reception-client/src/pages/ReceptionLoginPage.jsx`
- `reception-client/src/pages/ReceptionDashboardPage.jsx`
- `client/src/App.jsx`
- `client/src/api/api.js`
- `server/src/app.js`
- `README.md`

## Database

No database schema change is required for this frontend separation. The reception backend continues to use the existing `properties`, `rooms`, `bookings`, `users`, `property_photos`, `room_photos`, and `property_policies` tables.

## Important Note

The current project models inventory at **room-type level** (`total_rooms` / `available_rooms`). The reception dashboard follows that existing design. A future version can add individual room numbers, housekeeping states, and date-based room allocation without changing the separate reception-portal architecture.
