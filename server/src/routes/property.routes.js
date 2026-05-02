const express = require("express");

const {
  getApprovedProperties,
  getApprovedPropertyById,
  getApprovedPropertyRooms,
} = require("../controllers/property.controller");

const router = express.Router();

router.get("/", getApprovedProperties);
router.get("/:id", getApprovedPropertyById);
router.get("/:id/rooms", getApprovedPropertyRooms);

module.exports = router;