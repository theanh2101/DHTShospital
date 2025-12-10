// backend/src/routes/datlichletan.routes.js
const express = require("express");
const router = express.Router();
const datlichletanCtrl = require("../controllers/datlichletan.controller");

// GET /api/datlichletan
router.get("/", datlichletanCtrl.getAll);

// POST /api/datlichletan/create
router.post("/create", datlichletanCtrl.create);

// POST /api/datlichletan/checkin
router.post("/checkin", datlichletanCtrl.checkin);

// GET /api/datlichletan/doctors/schedule?id_khoa=...&ngay=...&ca=...
router.get("/doctors/schedule", datlichletanCtrl.getDoctorsBySchedule);

module.exports = router;
