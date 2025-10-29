const express = require("express");
const router = express.Router();
const DoctorDHSTController = require("../controllers/DoctorDHST.controller");

/**
 * @route   GET /api/DoctorDHST
 * @desc    Lấy danh sách lịch khám của bác sĩ (có thể lọc theo ngày)
 * @query   id_bacsi, ngay (optional)
 * @access  Public / Doctor only
 * @example /api/DoctorDHST?id_bacsi=BS001&ngay=2025-10-25
 */
router.get("/", DoctorDHSTController.getDoctorDHST);

// 🧩 Mở rộng CRUD sau này
// router.get("/:id_bacsi", DoctorDHSTController.getById);
// router.post("/", DoctorDHSTController.create);
// router.put("/:id", DoctorDHSTController.update);
// router.delete("/:id", DoctorDHSTController.delete);

module.exports = router;
