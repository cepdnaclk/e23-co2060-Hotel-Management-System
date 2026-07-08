Explore and Trip Planner hero top showcase fix

Replace these files:
client/src/pages/ExplorePage.jsx
client/src/pages/TripPlannerPage.jsx

Main changes:
- Explore top hero redesigned like a professional showcase section.
- Explore top hero still uses category-based Explore place photos and changes every 4 seconds.
- Explore hero includes search, category buttons, right-side preview card and stats.
- Trip Planner top hero redesigned in the same professional style.
- Trip Planner top hero loads slideshow photos from database only:
  - /api/explore/places for destinations
  - /api/properties for approved hotels
- Trip Planner slideshow changes every 4 seconds.
- No database reset needed.
