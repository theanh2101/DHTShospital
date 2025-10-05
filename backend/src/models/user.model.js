const db = require("../../config/db");

// Tạo tài khoản trong bảng TAIKHOAN
async function createUser(username, passwordHash, role, status = "ACTIVE") {
  const [result] = await db.query(
    "INSERT INTO TAIKHOAN (username, password, role, status) VALUES (?, ?, ?, ?)",
    [username, passwordHash, role, status]
  );
  return result.insertId;
}

// Thêm vào bảng BACSI
async function createDoctor(id_taikhoan, hoten, id_khoa) {
  await db.query(
    "INSERT INTO BACSI (id_taikhoan, ho_ten, id_khoa) VALUES (?, ?, ?)",
    [id_taikhoan, hoten, id_khoa || null]
  );
}

// Thêm vào bảng LETAN
async function createReceptionist(id_taikhoan, hoten) {
  await db.query(
    "INSERT INTO LETAN (id_taikhoan, ho_ten) VALUES (?, ?)",
    [id_taikhoan, hoten]
  );
}

module.exports = { createUser, createDoctor, createReceptionist };
