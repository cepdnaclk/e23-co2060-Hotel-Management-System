const express = require("express");
const { testDatabase } = require("../controllers/dbTest.controller");

const router = express.Router();

router.get("/db-test", testDatabase);

module.exports = router;