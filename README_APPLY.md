# TourismHub LK - Trip Planner Explore-style Landing Phase 47

This update applies the strong Explore-page landing style to the Trip Planner page while keeping the trip planner functions.

## Changed file
- client/src/pages/TripPlannerPage.jsx

## What changed
- Replaced the old left-card trip hero with an Explore-style full hero.
- Added centered professional title and subtitle.
- Added quick action pills for suggested routes, saved places, day planner, and hotels.
- Added floating action switcher: Use island highlights, Add from Explore, Planner guide.
- Kept existing planning workflow, route templates, saved destinations, PDF export, and hotel connection.

## Apply
Copy the `client` folder into your project root and choose Replace files.

Then run:
```bash
cd client
npm run dev
```

## Commit
```bash
git status
git add client/src/pages/TripPlannerPage.jsx
git commit -m "Apply Explore-style landing to trip planner"
git push origin dev
```
