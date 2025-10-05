// controllers/khoa.controller.js
const Khoa = require("../models/khoa.model");

exports.getAllKhoa = async (req, res) => {
  try {
    const data = await Khoa.getAll();
    res.json(data);
  } catch (err) {
    console.error("Lỗi lấy danh sách khoa:", err);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách khoa" });
  }
};
