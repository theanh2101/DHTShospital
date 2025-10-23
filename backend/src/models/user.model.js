const db = require("../../config/db");

// 🔹 Hàm sinh mã tự động theo role
async function generateIdByRole(role) {
  const prefix = role === "BACSI" ? "BS" : role === "LETAN" ? "LT" : "TK";
  const table = "TAIKHOAN";
  const column = "id_taikhoan";

  // Lấy ID mới nhất chỉ theo role
  const [rows] = await db.query(
    `SELECT ${column} FROM ${table} WHERE role=? ORDER BY LENGTH(${column}) DESC, ${column} DESC LIMIT 1`,
    [role]
  );

  let nextNumber = 1;

  if (rows.length > 0) {
    const lastId = String(rows[0][column]);
    const num = parseInt(lastId.replace(prefix, ""), 10);
    nextNumber = (isNaN(num) ? 0 : num) + 1; // ✅ tránh NaN
  }

  return prefix + String(nextNumber).padStart(3, "0");
}

// 🔹 Tạo tài khoản trong TAIKHOAN
async function createUser(username, passwordHash, role, status = "ACTIVE") {
  const newId = await generateIdByRole(role);
  await db.query(
    "INSERT INTO TAIKHOAN (id_taikhoan, username, password, role, status) VALUES (?, ?, ?, ?, ?)",
    [newId, username, passwordHash, role, status]
  );
  return newId; // ✅ Đây sẽ là id_taikhoan và cũng là id_letan / id_bacsi
}

// 🔹 Thêm vào bảng BACSI
async function createDoctor(id_taikhoan, ho_ten, id_khoa, phone = null, email = null) {
  await db.query(
    "INSERT INTO BACSI (id_bacsi, id_taikhoan, ho_ten, id_khoa, phone, email) VALUES (?, ?, ?, ?, ?, ?)",
    [id_taikhoan, id_taikhoan, ho_ten, id_khoa || null, phone, email]
  );
}

// 🔹 Thêm vào bảng LETAN
async function createReceptionist(id_taikhoan, ho_ten, phone = null, email = null) {
  await db.query(
    "INSERT INTO LETAN (id_letan, id_taikhoan, ho_ten, phone, email) VALUES (?, ?, ?, ?, ?)",
    [id_taikhoan, id_taikhoan, ho_ten, phone, email]
  );
}

module.exports = { createUser, createDoctor, createReceptionist };
