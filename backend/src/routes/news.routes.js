const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const NewsController = require("../controllers/news.controller");

// ================== CẤU HÌNH LƯU ẢNH TẠM ==================
// Ảnh chỉ được lưu tạm trong thư mục "temp_uploads" để đọc vào buffer rồi xóa
const tempDir = path.join(__dirname, "../../temp_uploads");
fs.mkdirSync(tempDir, { recursive: true }); // đảm bảo thư mục tồn tại

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// 💡 FIX: Thêm giới hạn Multer để tránh lỗi "Field value too long"
const upload = multer({ 
    storage,
    limits: {
        // Tăng giới hạn kích thước cho MỘT trường văn bản (bao gồm cả Base64) lên 10MB
        fieldSize: 10 * 1024 * 1024, 
        // Giới hạn kích thước file upload riêng (ví dụ 5MB)
        fileSize: 5 * 1024 * 1024,
    }
});

// ================== CÁC ROUTE TIN TỨC ==================

// 📋 Lấy toàn bộ tin tức
router.get("/", NewsController.getAll);

// 📁 Lấy tin tức theo danh mục
router.get("/category/:category", NewsController.getByCategory);

// 🔍 Lấy chi tiết theo ID
router.get("/:id", NewsController.getById);

// ➕ Thêm bài viết mới (ảnh lưu binary)
router.post("/", upload.single("image"), NewsController.create);

// ✏️ Cập nhật bài viết
router.put("/:id", upload.single("image"), NewsController.update);

// 🔄 Cập nhật trạng thái
router.patch("/:id/status", NewsController.updateStatus);

// 🗑️ Xóa bài viết
router.delete("/:id", NewsController.delete);

module.exports = router;