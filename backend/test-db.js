const mysql = require("mysql2/promise");
require("dotenv").config();

(async () => {
  try {
    console.log("Đang kết nối...");
    console.log("Host:", process.env.DB_HOST);
    console.log("User:", process.env.DB_USER);
    console.log("DB:", process.env.DB_NAME);
    
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT 1 as ok');
    console.log("✅ Kết nối MySQL thành công!", rows);
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi kết nối:", err.message);
    console.error("Code:", err.code);
    process.exit(1);
  }
})();
