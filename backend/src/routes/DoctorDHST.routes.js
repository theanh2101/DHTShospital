const express = require('express');
const router = express.Router();
const controller = require('../controllers/DoctorDHST.controller');

// =========================================================
// 1. NHÓM API QUẢN LÝ BÁC SĨ
// =========================================================
// Lấy ID bác sĩ từ tài khoản đăng nhập
router.get('/getBacsiId', controller.getBacsiIdFromTaikhoan);

// Lấy thông tin cá nhân bác sĩ
router.get('/doctorProfile', controller.getDoctorProfile);

// Cập nhật thông tin bác sĩ (bao gồm ảnh LongBlob)
router.put('/update', controller.updateDoctorProfile);

// Lấy lịch làm việc/danh sách bệnh nhân theo ngày
router.get('/schedule', controller.getDoctorSchedule);

// Lấy thống kê nhanh trong ngày (Dashboard)
router.get('/thongke/today', controller.getDailyStatistics);


// =========================================================
// 2. NHÓM API BỆNH NHÂN & HỒ SƠ KHÁM
// =========================================================
// Lấy thông tin hành chính bệnh nhân
router.get('/patient/detail', controller.getPatientDetail);

// Lấy chi tiết đầy đủ lượt khám hiện tại (Bệnh nhân + Bệnh án + Thuốc)
router.get('/full_detail', controller.getFullRecordDetail);

// Lấy danh sách đặt lịch của bệnh nhân (nếu cần)
router.get('/getDatlich', controller.getDatlichByBenhnhan);


// =========================================================
// 🔥 3. NHÓM API LỊCH SỬ (TÍCH HỢP TỪ TRA CỨU)
// =========================================================

// Lấy danh sách các lần khám trước (Đã loại trừ lượt đang khám)
// URL: /api/DoctorDHST/patient/visits/:id?currentDatlichId=...
router.get('/patient/visits/:id', controller.getPatientHistory);

// Lấy chi tiết một lần khám cũ (Bao gồm chẩn đoán & đơn thuốc JSON)
// URL: /api/DoctorDHST/patient/history-detail/:id_hoso
router.get('/patient/history-detail/:id_hoso', controller.getHistoryDetail);


// =========================================================
// 4. NHÓM API LƯU TRỮ (TRANSACTION)
// =========================================================
// Lưu riêng toa thuốc
router.post('/save_toa', controller.savePrescription);

// Lưu bệnh án (Hoàn tất khám)
router.post('/save_benhan', controller.saveMedicalRecord);

module.exports = router;