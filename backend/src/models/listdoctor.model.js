// src/models/listdoctor.model.js
const pool = require("../../config/db");

const Doctor = {
  // Lấy danh sách bác sĩ VỚI TÊN KHOA
// Lấy danh sách tất cả bác sĩ, kể cả những người chưa có khoa
  async getAll() {
    try {
      const sql = `
        SELECT 
            bs.id_bacsi, 
            bs.ho_ten, 
            bs.hoc_vi, 
            bs.chuc_vu, 
            k.ten_khoa  -- Nếu bác sĩ chưa có khoa, cột này sẽ là NULL
        FROM bacsi bs
        LEFT JOIN khoa k ON bs.id_khoa = k.id_khoa 
        ORDER BY bs.id_bacsi
      `;
      const [rows] = await pool.query(sql);
      return rows;
    } catch (err) {
      console.error("Lỗi khi truy vấn danh sách bác sĩ (LEFT JOIN):", err);
      throw err;
    }
  },

  // Lấy bác sĩ theo ID
 // Lấy bác sĩ theo ID, có cả thông tin khoa
async getById(id_bacsi) {
  try {
    const sql = `
      SELECT 
          bs.id_bacsi,
          bs.ho_ten,
          bs.hinh_anh,
          bs.hoc_vi,
          bs.chuc_vu,
          bs.chuyen_mon,
          bs.qua_trinh_dao_tao,
          bs.qua_trinh_cong_tac,
          bs.the_manh_kinh_nghiem,
          bs.nam_kinh_nghiem,
          bs.phone,
          bs.email,
          bs.id_khoa,
          k.ten_khoa 
      FROM bacsi bs
      LEFT JOIN khoa k ON bs.id_khoa = k.id_khoa
      WHERE bs.id_bacsi = ?
    `;
    const [rows] = await pool.query(sql, [id_bacsi]);
    return rows[0]; // Trả về 1 bác sĩ
  } catch (err) {
    console.error("Lỗi khi truy vấn bác sĩ theo ID:", err);
    throw err;
  }
},
  // Cập nhật thông tin (không sửa tên)
  async update(id_bacsi, data) {
    try {
      const { hinh_anh, chuyen_mon, phone, email } = data;
      const [result] = await pool.query(
        "UPDATE bacsi SET hinh_anh = ?, chuyen_mon = ?, sdt = ?, email = ? WHERE id_bacsi = ?",
        [hinh_anh, chuyen_mon, phone, email, id_bacsi]
      );
      return result;
    } catch (err) {
      throw err;
    }
  },

  // Khóa / Mở khóa
  async lock(id_bacsi, isLocked) {
    try {
      const [result] = await pool.query(
        "UPDATE bacsi SET trangthai = ? WHERE id_bacsi = ?",
        [isLocked ? 0 : 1, id_bacsi]
      );
      return result;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Doctor;
