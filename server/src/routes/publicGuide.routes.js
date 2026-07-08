const express = require("express");
const {
  getPublicGuides,
  getPublicGuideBySlug,
} = require("../controllers/publicGuide.controller");

const router = express.Router();

router.get("/", getPublicGuides);
router.get("/:slug", getPublicGuideBySlug);

module.exports = router;
