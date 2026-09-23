const express = require("express");
const {
  getPublicGuides,
  getPublicGuideBySlug,
  getPublicGuideReviews,
} = require("../controllers/publicGuide.controller");

const router = express.Router();

router.get("/", getPublicGuides);
router.get("/:slug/reviews", getPublicGuideReviews);
router.get("/:slug", getPublicGuideBySlug);

module.exports = router;
