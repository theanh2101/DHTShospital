const express = require('express');
const router = express.Router();
const controller = require('../controllers/DoctorDHST.controller');

// =========================================================
// 1. QUẢN LÝ BÁC SĨ & LỊCH TRÌNH
// =========================================================

// Lấy id_bacsi từ id_taikhoan (Dùng khi đăng nhập)
// GET /api/DoctorDHST/getBacsiId?id_taikhoan=... 
router.get('/getBacsiId', controller.getBacsiIdFromTaikhoan);

// Lấy thông tin hồ sơ bác sĩ
// GET /api/DoctorDHST/doctorProfile?id_bacsi=...
router.get('/doctorProfile', controller.getDoctorProfile);

// Cập nhật thông tin bác sĩ
// PUT /api/DoctorDHST/update
router.put('/update', controller.updateDoctorProfile);

// Lấy lịch làm việc & danh sách bệnh nhân theo ngày
// GET /api/DoctorDHST/schedule?id_bacsi=...&ngay=...
router.get('/schedule', controller.getDoctorSchedule);

// Thống kê số lượng khám trong ngày
// GET /api/DoctorDHST/thongke/today?id_bacsi=... 
router.get('/thongke/today', controller.getDailyStatistics);


// =========================================================
// 2. QUẢN LÝ BỆNH NHÂN & HỒ SƠ BỆNH ÁN
// =========================================================

// Lấy chi tiết thông tin bệnh nhân (API cũ, vẫn giữ để tương thích)
// GET /api/DoctorDHST/patient/detail?id_benhnhan=...
router.get('/patient/detail', controller.getPatientDetail);

// [MỚI & QUAN TRỌNG] Lấy TẤT CẢ thông tin chi tiết dựa trên LỊCH HẸN
// (Dùng cho Modal khám bệnh: Lấy cả thông tin khách vãng lai chưa có hồ sơ)
// GET /api/DoctorDHST/full_detail?id_datlich=...
router.get('/full_detail', controller.getFullRecordDetail);

// Lấy id_datlich từ id_benhnhan và id_bacsi (Hỗ trợ tìm ngược)
// GET /api/DoctorDHST/getDatlich?id_benhnhan=...&id_bacsi=...
router.get('/getDatlich', controller.getDatlichByBenhnhan);

// Lưu toa thuốc
// POST /api/DoctorDHST/save_toa
router.post('/save_toa', controller.savePrescription);

// Lưu bệnh án (Có transaction: Tự động tạo bệnh nhân mới nếu chưa có)
// POST /api/DoctorDHST/save_benhan
router.post('/save_benhan', controller.saveMedicalRecord);

module.exports = router;


// ... các routes khác
router.post('/save_toa', controller.savePrescription);

// 👇 THÊM DÒNG NÀY ĐỂ API LỊCH SỬ HOẠT ĐỘNG 👇
router.get('/patient/visits/:id', controller.getPatientHistory);

module.exports = router;
