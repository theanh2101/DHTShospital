// routes/patient.routes.js
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');

// Gửi OTP và xác thực
router.post('/search/request-otp', patientController.requestOtp);
router.post('/search/verify-otp', patientController.verifyOtpAndGetPatients);

// Lịch sử khám
router.get('/visits/:patientId', patientController.getPatientVisits);
router.get('/visit-details/:lichKhamId', patientController.getVisitDetails);
router.get('/visit-details/:lichKhamId/download-pdf', patientController.downloadVisitPdf);

// ✅ Route mới: tìm bệnh nhân theo số điện thoại (cho lễ tân)
router.get('/phone/:sdt', patientController.getPatientByPhone);

module.exports = router;
