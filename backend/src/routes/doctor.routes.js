const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctor.controller");

router.get("/", doctorController.getAllDoctors);
router.get("/search", doctorController.searchDoctors);

module.exports = router;
