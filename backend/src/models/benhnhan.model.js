// models/benhnhan.model.js
const db = require("../../config/db");

const findOrCreate = async (patientData) => {
  try {
    const { ho_ten, phone, email } = patientData;

    // 1️⃣ Tìm bệnh nhân theo SĐT
    const [rows] = await db.query(
      "SELECT * FROM benhnhan WHERE phone = ? LIMIT 1",
      [phone]
    );

    if (rows.length > 0) {
      // Đã tồn tại
      return rows[0];
    }

    // 2️⃣ Nếu chưa có, tạo mới
    const [result] = await db.query(
      "INSERT INTO benhnhan (ho_ten, phone, email) VALUES (?, ?, ?)",
      [ho_ten, phone, email || null] // email có thể null
    );

    // 3️⃣ Trả về thông tin bệnh nhân mới
    return {
      id_benhnhan: result.insertId,
      ho_ten,
      phone,
      email: email || null,
    };
  } catch (error) {
    console.error("❌ Lỗi trong BenhNhanModel.findOrCreate:", error);
    throw new Error("Không thể xử lý thông tin bệnh nhân.");
  }
};

module.exports = { findOrCreate };
