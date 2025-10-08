const NewsModel = require("../models/news.model");
const path = require("path");
const fs = require("fs");

const NewsController = {
  // 📌 Lấy tất cả bài viết
  async getAll(req, res) {
    try {
      const news = await NewsModel.getAll();
      res.json(news);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách bài viết:", err);
      res.status(500).json({ error: "Không thể tải danh sách bài viết" });
    }
  },

  // 📌 Lấy bài viết theo ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const news = await NewsModel.getById(id);
      if (!news) return res.status(404).json({ error: "Không tìm thấy bài viết" });
      res.json(news);
    } catch (err) {
      console.error("❌ Lỗi lấy bài viết:", err);
      res.status(500).json({ error: "Không thể tải bài viết" });
    }
  },

  // 📌 Tạo bài viết mới
  async create(req, res) {
    try {
      const { title, slug, summary, content, author, category } = req.body;

      // ✅ Đảm bảo ảnh lưu đúng đường dẫn tuyệt đối
      const image = req.file ? `/uploads/news/${req.file.filename}` : null;

      if (!title || !slug || !summary || !content) {
        return res.status(400).json({ error: "Thiếu thông tin bài viết" });
      }

      const newId = await NewsModel.create({
        title,
        slug,
        summary,
        content,
        image,
        author,
        category,
      });

      res.json({ message: "✅ Đăng bài thành công!", id: newId });
    } catch (err) {
      console.error("❌ Lỗi tạo bài viết:", err);
      res.status(500).json({ error: "Lỗi đăng bài" });
    }
  },

  // 📌 Cập nhật bài viết
  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, slug, summary, content, author, category, status } = req.body;

      // ✅ Nếu có ảnh mới thì cập nhật, không thì giữ nguyên ảnh cũ
      const image = req.file
        ? `/uploads/news/${req.file.filename}`
        : req.body.image;

      const affected = await NewsModel.update(id, {
        title,
        slug,
        summary,
        content,
        image,
        author,
        category,
        status,
      });

      if (affected === 0)
        return res.status(404).json({ error: "Không tìm thấy bài viết" });

      res.json({ message: "✅ Cập nhật thành công!" });
    } catch (err) {
      console.error("❌ Lỗi cập nhật bài viết:", err);
      res.status(500).json({ error: "Không thể cập nhật bài viết" });
    }
  },

  // 📌 Xóa bài viết
  async delete(req, res) {
    try {
      const { id } = req.params;
      const news = await NewsModel.getById(id);
      if (!news) return res.status(404).json({ error: "Không tìm thấy bài viết" });

      // ✅ Xóa file ảnh trên ổ đĩa (nếu có)
      if (news.image) {
        const imagePath = path.join(__dirname, "../../public", news.image);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      await NewsModel.delete(id);
      res.json({ message: "🗑️ Đã xóa bài viết thành công!" });
    } catch (err) {
      console.error("❌ Lỗi xóa bài viết:", err);
      res.status(500).json({ error: "Không thể xóa bài viết" });
    }
  },
};

module.exports = NewsController;
