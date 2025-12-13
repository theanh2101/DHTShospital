// routes/thongke.routes.js
const express = require('express');
const router = express.Router();
const thongKeController = require('../controllers/thongke.controller');

// Định nghĩa endpoint cho thống kê bệnh nhân theo ngày
// Full path: GET /api/thongke/patient-by-day
router.get('/patient-by-day', thongKeController.getPatientCountByDay);

module.exports = router;