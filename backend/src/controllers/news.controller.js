const NewsModel = require("../models/news.model");
const path = require("path");
const fs = require("fs");

// 🧩 Hàm tạo slug từ tiêu đề
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const NewsController = {
  // 📋 Lấy danh sách tất cả bài viết
  async getAll(req, res) {
    try {
      const news = await NewsModel.getAll();
      res.status(200).json(news);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách bài viết:", err);
      res.status(500).json({ error: "Không thể tải danh sách bài viết" });
    }
  },

  // 🔍 Lấy bài viết theo ID
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

  // 🧭 Lọc bài viết theo danh mục
  async getByCategory(req, res) {
    try {
      const category = decodeURIComponent(req.params.category);
      const filtered =
        category === "Tất cả"
          ? await NewsModel.getAll()
          : await NewsModel.getByCategory(category);
      res.json(filtered);
    } catch (err) {
      console.error("❌ Lỗi lọc bài viết:", err);
      res.status(500).json({ error: "Không thể lọc bài viết" });
    }
  },

  // ➕ Thêm bài viết mới
  async create(req, res) {
    try {
      const { title, summary, content, author, category } = req.body;
      if (!title || !content)
        return res.status(400).json({ error: "Thiếu tiêu đề hoặc nội dung" });

      const image = req.file ? `/uploads/news/${req.file.filename}` : null;
      const slug = generateSlug(title);
      const status = "published";

      const newId = await NewsModel.create({
        title,
        slug,
        summary,
        content,
        image,
        author,
        category,
        status,
      });

      res.json({ message: "✅ Đăng bài thành công!", id: newId });
    } catch (err) {
      console.error("❌ Lỗi tạo bài viết:", err);
      res.status(500).json({ error: "Không thể tạo bài viết" });
    }
  },

  // ✏️ Cập nhật bài viết (giữ nguyên nội dung cũ nếu không nhập mới)
  async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await NewsModel.getById(id);
      if (!existing)
        return res.status(404).json({ error: "Không tìm thấy bài viết" });

      const { title, summary, content, author, category, status } = req.body;

      // 🖼️ Xử lý ảnh (giữ ảnh cũ nếu không có ảnh mới)
      let imagePath = existing.image;
      if (req.file) {
        // Xóa ảnh cũ nếu có
        if (existing.image) {
          const oldPath = path.join(__dirname, "../../public", existing.image);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        imagePath = `/uploads/news/${req.file.filename}`;
      }

      // 🧩 Giữ lại các trường cũ nếu không gửi mới
      const updatedData = {
        title: title || existing.title,
        slug: title ? generateSlug(title) : existing.slug,
        summary: summary || existing.summary,
        content: content || existing.content,
        image: imagePath,
        author: author || existing.author,
        category: category || existing.category,
        status: status || existing.status,
      };

      const affected = await NewsModel.update(id, updatedData);
      if (affected === 0)
        return res.status(404).json({ error: "Không thể cập nhật bài viết" });

      res.json({ message: "✅ Cập nhật bài viết thành công!" });
    } catch (err) {
      console.error("❌ Lỗi cập nhật bài viết:", err);
      res.status(500).json({ error: "Không thể cập nhật bài viết" });
    }
  },

  // 🗑️ Xóa bài viết
  async delete(req, res) {
    try {
      const { id } = req.params;
      const news = await NewsModel.getById(id);
      if (!news) return res.status(404).json({ error: "Không tìm thấy bài viết" });

      // Xóa ảnh nếu có
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

  // 🔄 Đổi trạng thái bài viết (ẩn / hiện)
 // 🔄 Đổi trạng thái bài viết (ẩn / hiện)
async updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const news = await NewsModel.getById(id);
    if (!news)
      return res.status(404).json({ error: "Không tìm thấy bài viết" });

    await NewsModel.updateStatus(id, status);
    res.json({ message: "✅ Cập nhật trạng thái thành công!", status });
  } catch (err) {
    console.error("❌ Lỗi đổi trạng thái:", err);
    res.status(500).json({ error: "Không thể cập nhật trạng thái bài viết" });
  }
},

};

module.exports = NewsController;
