const express = require("express");
const {
  getTouristEvents,
  getTouristEventBySlug,
  getTouristEventsByPlace,
} = require("../controllers/touristEvent.controller");

const router = express.Router();

router.get("/events", getTouristEvents);
router.get("/events/by-place/:placeId", getTouristEventsByPlace);
router.get("/events/:slug", getTouristEventBySlug);

module.exports = router;
