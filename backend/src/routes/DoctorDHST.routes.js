const express = require("express");
const router = express.Router();
const bacsiController = require("../controllers/bacsi.controller");

router.get("/", bacsiController.getAllBacSi);

module.exports = router;
