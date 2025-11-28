// src/routes/hoso.routes.js
const express = require('express');
const router = express.Router();
const hosoController = require('../controllers/hoso.controller');

// Tạo hồ sơ từ dat_lich khi bệnh nhân tới
router.post('/from-datlich', hosoController.createFromDatLich);

// Tạo hồ sơ walk-in
router.post('/walkin', hosoController.createWalkin);

// Xác nhận bệnh nhân đã đến
router.put('/:id_hoso/arrival', hosoController.confirmArrival);

// Lấy chi tiết hồ sơ
router.get('/:id_hoso', hosoController.getHoSoChiTiet);

// Lấy danh sách bệnh nhân theo bác sĩ
router.get('/doctor/:id_bacsi', hosoController.getDanhSachBenhNhanTheoBacSi);

// ✅ ROUTE MỚI: Lấy hồ sơ theo bệnh nhân (cho lễ tân xem)
router.get('/benhnhan/:id_benhnhan', hosoController.getByBenhNhan);

module.exports = router;
