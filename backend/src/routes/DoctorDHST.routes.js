const express = require('express');
const router = express.Router();
const DoctorDHSTController = require('../controllers/DoctorDHST.controller');

// API: GET /api/DoctorDHST?id_bacsi=BS001&ngay=2025-10-25
router.get('/', DoctorDHSTController.getDoctorDHST);

module.exports = router;
