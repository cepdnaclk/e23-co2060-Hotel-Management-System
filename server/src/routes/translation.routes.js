const express = require("express");
const { translateBatch } = require("../controllers/translation.controller");

const router = express.Router();

router.post("/batch", translateBatch);

module.exports = router;
