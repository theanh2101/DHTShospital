const express = require("express");
const router = express.Router();
const NewsController = require("../controllers/news.controller");

// Lấy tất cả bài viết
router.get("/", NewsController.getAll);

// Lấy bài viết theo ID
router.get("/:id", NewsController.getById);

// Thêm bài viết mới
router.post("/", NewsController.create);

// Cập nhật bài viết
router.put("/:id", NewsController.update);

// Xóa bài viết
router.delete("/:id", NewsController.delete);

module.exports = router;
