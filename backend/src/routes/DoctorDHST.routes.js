const express = require("express");
const router = express.Router();
const DoctorController = require("../controllers/DoctorDHST.controller");

// ===============================================================
// 🩺 API CHÍNH LIÊN QUAN ĐẾN BÁC SĨ & LỊCH KHÁM
// ===============================================================

/**
 * @route   GET /api/doctors/profile
 * @desc    📄 Lấy hồ sơ chi tiết của bác sĩ theo ID
 * @query   id_bacsi=BS001
 * @access  Public
 */
router.get("/doctors/profile", DoctorController.getDoctorProfile);

/**
 * @route   GET /api/doctors/schedules
 * @desc    📅 Lấy danh sách lịch khám của bác sĩ (và lọc theo ngày nếu có)
 * @query   id_bacsi=BS001&ngay=YYYY-MM-DD
 * @access  Public
 */
router.get("/doctors/schedules", DoctorController.getDoctorDHST);

// ===============================================================
// 🔍 ROUTE KIỂM TRA HOẠT ĐỘNG
// ===============================================================
/**
 * @route   GET /api/doctors/test
 * @desc    🧠 Kiểm tra API DoctorDHST hoạt động
 * @access  Public
 */
router.get("/doctors/test", (req, res) => {
  res.json({
    success: true,
    message: "✅ API DoctorDHST Routes hoạt động bình thường!",
    endpoints: [
      "/api/doctors/profile?id_bacsi=BS001",
      "/api/doctors/schedules?id_bacsi=BS001&ngay=YYYY-MM-DD",
    ],
  });
});

module.exports = router;
