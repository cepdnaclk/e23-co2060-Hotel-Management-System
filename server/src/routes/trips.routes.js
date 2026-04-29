const express = require("express");

const {
  createTrip,
  getMyTrips,
  getTripDetails,
  deleteTrip,
  addEventToTrip,
  removeEventFromTrip,
} = require("../controllers/trips.controller");

const router = express.Router();

router.post("/", createTrip);

router.get("/my-trips", getMyTrips);

router.get("/:id", getTripDetails);

router.delete("/:id", deleteTrip);

router.post("/:id/events", addEventToTrip);

router.delete("/:id/events/:eventId", removeEventFromTrip);

module.exports = router;