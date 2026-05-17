require("dotenv").config();
const mysql = require("mysql2/promise"); // ✅ Dùng promise ngay từ đầu

// Tạo pool kết nối
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ✅ Kiểm tra kết nối 1 lần khi khởi động
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Kết nối MySQL thành công!");
    conn.release();
  } catch (err) {
    if (err.code === "ER_ACCESS_DENIED_ERROR")
      console.error("❌ Sai tài khoản hoặc mật khẩu MySQL.");
    else if (err.code === "ENOTFOUND")
      console.error("❌ Không tìm thấy host MySQL.");
    else
      console.error("❌ Lỗi kết nối database:", err);
  }
})();

module.exports = pool; // ✅ Export pool promise gốc
