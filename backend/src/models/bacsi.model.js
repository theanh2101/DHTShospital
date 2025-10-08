// models/bacsi.model.js
const db = require("../../config/db");

/**
 * Chọn bác sĩ trong khoa có ít lịch hẹn nhất.
 * Nếu khoa không có bác sĩ, ném lỗi.
 */
const assignDoctorByKhoa = async (id_khoa) => {
  const sql = `
    SELECT b.id_bacsi, b.ho_ten, b.chuyen_mon
    FROM bacsi b
    LEFT JOIN datlich dl ON b.id_bacsi = dl.id_bacsi AND dl.trang_thai != 'Huy'
    WHERE b.id_khoa = ?
    GROUP BY b.id_bacsi
    ORDER BY COUNT(dl.id_datlich) ASC
    LIMIT 1;
  `;
  const [rows] = await db.query(sql, [id_khoa]);
  if (rows.length === 0) {
    throw new Error(`Khoa này hiện không có bác sĩ nào để phân công.`);
  }
  return rows[0];
};

module.exports = { assignDoctorByKhoa };
