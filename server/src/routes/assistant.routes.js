const express = require("express");
const router = express.Router();

const { askAssistant } = require("../controllers/assistant.controller");

router.post("/chat", askAssistant);

module.exports = router;