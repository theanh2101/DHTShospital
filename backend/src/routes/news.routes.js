const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const NewsController = require("../controllers/news.controller");

// ================== CẤU HÌNH LƯU FILE ẢNH ==================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ✅ Đường dẫn tuyệt đối ra thư mục public/uploads/news
    const uploadPath = path.join(__dirname, "../../public/uploads/news");
    fs.mkdirSync(uploadPath, { recursive: true }); // Tự tạo nếu chưa có
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // ✅ Đặt tên file duy nhất theo timestamp
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ================== CÁC ROUTE TIN TỨC ==================

// 📌 Lấy toàn bộ tin tức
router.get("/", NewsController.getAll);

// 📌 Lấy tin tức theo phân loại
router.get("/category/:category", NewsController.getByCategory);

// 📌 Lấy chi tiết theo ID
router.get("/:id", NewsController.getById);

// 📌 Tạo mới tin tức (có upload ảnh)
router.post("/", upload.single("image"), NewsController.create);

// 📌 Cập nhật tin tức
router.put("/:id", upload.single("image"), NewsController.update);

// 📌 Xóa tin tức
router.delete("/:id", NewsController.delete);

// 🔄 Đổi trạng thái bài viết
router.patch("/:id/status", NewsController.updateStatus);


module.exports = router;

