const mysql = require("mysql2");

// Kết nối MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",      
  password: "219999",       
  database: "hospital_db"
});

db.connect(err => {
  if (err) {
    console.error("❌ Lỗi kết nối MySQL:", err);
  } else {
    console.log("✅ Kết nối MySQL thành công!");
  }
});

module.exports = db;
