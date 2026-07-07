const express = require("express");
const { optionalProtect } = require("../middleware/auth.middleware");
const {
  getExploreCategories,
  getExploreSettings,
  getExplorePlaces,
  getExplorePlaceById,
  getSeasonalPlaces,
  getExploreItineraries,
} = require("../controllers/explore.controller");

const router = express.Router();

router.get("/categories", getExploreCategories);
router.get("/settings", getExploreSettings);
router.get("/places", optionalProtect, getExplorePlaces);
router.get("/places/:id", optionalProtect, getExplorePlaceById);
router.get("/seasonal", getSeasonalPlaces);
router.get("/itineraries", getExploreItineraries);

module.exports = router;
