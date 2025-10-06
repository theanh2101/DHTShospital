const NewsModel = require("../models/news.model");

const NewsController = {
  getAll: async (req, res) => {
    try {
      const news = await NewsModel.getAll();
      res.json(news);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  getById: async (req, res) => {
    try {
      const news = await NewsModel.getById(req.params.id);
      if (!news) return res.status(404).json({ message: "Bài viết không tồn tại" });
      res.json(news);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  create: async (req, res) => {
    try {
      const id = await NewsModel.create(req.body);
      res.status(201).json({ id, ...req.body });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  update: async (req, res) => {
    try {
      const affectedRows = await NewsModel.update(req.params.id, req.body);
      if (!affectedRows) return res.status(404).json({ message: "Bài viết không tồn tại" });
      res.json({ message: "Cập nhật thành công" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  delete: async (req, res) => {
    try {
      const affectedRows = await NewsModel.delete(req.params.id);
      if (!affectedRows) return res.status(404).json({ message: "Bài viết không tồn tại" });
      res.json({ message: "Xóa thành công" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
};

module.exports = NewsController;
