// controllers/khoa.controller.js
const KhoaModel = require('../models/khoa.model');

const getAllKhoa = async (req, res) => {
  console.log("📥 Nhận request GET /api/khoa");
  try {
    const khoaList = await KhoaModel.findAll();
    console.log("✅ Lấy được danh sách khoa:", khoaList);
    res.status(200).json(khoaList);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách khoa:", error);
    res.status(500).json({ message: error.message || "Lỗi khi lấy danh sách khoa." });
  }
};

module.exports = { getAllKhoa };
