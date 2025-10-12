const express = require("express");
const router = express.Router();
const listDoctorController = require("../controllers/listdoctor.controller");

console.log("🧩 Controller import:", listDoctorController);


// 1️⃣ Lấy danh sách bác sĩ
router.get("/", listDoctorController.getAllDoctors);

// 2️⃣ Lấy chi tiết bác sĩ theo id_bacsi
router.get("/:id_bacsi", listDoctorController.getDoctorById);

// 3️⃣ Cập nhật thông tin bác sĩ (không cho sửa tên)
router.put("/:id_bacsi", listDoctorController.updateDoctor);

// 4️⃣ Khóa / mở khóa hồ sơ bác sĩ
router.patch("/:id_bacsi/lock", listDoctorController.lockDoctor);

module.exports = router;
