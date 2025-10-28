const express = require('express');
const router = express.Router();
const DoctorDHSTController = require('../controllers/DoctorDHST.controller');

// 🩺 API: Lấy danh sách lịch khám của bác sĩ
// 👉 GET /api/DoctorDHST?id_bacsi=BS001&ngay=2025-10-25
router.get('/', DoctorDHSTController.getDoctorDHST);

// 🧩 Có thể mở rộng sau (CRUD)
// router.get('/:id_bacsi', DoctorDHSTController.getById);
// router.post('/', DoctorDHSTController.create);
// router.put('/:id', DoctorDHSTController.update);
// router.delete('/:id', DoctorDHSTController.delete);

module.exports = router;
