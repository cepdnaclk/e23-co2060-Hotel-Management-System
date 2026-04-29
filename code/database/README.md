# TourismHub LK Database

This folder contains the database files for the TourismHub LK Smart Hotel and Tourism Management System.

## Database Technology

- MySQL Community Edition
- Database name: `tourismhub_lk`

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Creates the database and all required tables |
| `seed.sql` | Adds sample users, hotels, rooms, events, bookings, reviews, and complaints |

## How to Setup Database

Open MySQL Command Line Client or MySQL Workbench.

### Step 1: Run schema file

```sql
SOURCE path/to/database/schema.sql;