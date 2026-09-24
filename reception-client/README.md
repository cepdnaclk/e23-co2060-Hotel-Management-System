# TripLanka Reception Client

This is the standalone frontend for hotel reception staff. It is intentionally separate from both the public/partner frontend (`client`) and administrator frontend (`admin-client`).

## Run locally

Start the backend first from `server/`, then run:

```bash
npm install
npm run dev
```

The application opens on `http://localhost:5175`.

- Login: `http://localhost:5175/login`
- Dashboard: `http://localhost:5175/dashboard`

## Login

Use the hotel partner email and the property management password for an approved property. The backend issues a reception-only JWT scoped to that property.

## Environment

Copy `.env.example` to `.env` only when you need to override the defaults.

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_MAIN_SITE_URL=http://localhost:5173
```
