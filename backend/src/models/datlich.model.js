// src/models/datlich.model.js
const db = require("../../config/db");

const DatLich = {
  create: async (bookingData, connection) => {
    const conn = connection || db;
    const sql = "INSERT INTO dat_lich SET ?";
    const [result] = await conn.query(sql, bookingData);
    return { id_datlich: result.insertId, ...bookingData };
  },

  countAppointmentsForDoctorInSlot: async (ngay, khung_gio, id_bacsi, connection) => {
    const conn = connection || db;
    const sql = `
      SELECT COUNT(*) as count 
      FROM dat_lich
      WHERE ngay = ? AND khung_gio = ? AND id_bacsi = ? AND trang_thai != 'HOAN_THANH'
    `;
    const [rows] = await conn.query(sql, [ngay, khung_gio, id_bacsi]);
    return rows[0].count;
  },

  countInSlot: async (ngay, khung_gio, id_khoa, connection) => {
    const conn = connection || db;
    const sql = `
      SELECT COUNT(*) as count 
      FROM dat_lich
      WHERE ngay = ? AND khung_gio = ? AND id_khoa = ? AND trang_thai != 'HOAN_THANH'
    `;
    const [rows] = await conn.query(sql, [ngay, khung_gio, id_khoa]);
    return rows[0].count;
  },

  findFullSlots: async (ngay, id_khoa) => {
    const sql = `
      SELECT khung_gio
      FROM dat_lich
      WHERE ngay = ? AND id_khoa = ? AND trang_thai != 'HOAN_THANH'
      GROUP BY khung_gio
      HAVING COUNT(*) >= 10;
    `;
    const [rows] = await db.query(sql, [ngay, id_khoa]);
    return rows.map(row => row.khung_gio);
  },

  /**
   * Lấy danh sách bệnh nhân theo bác sĩ (kết hợp dat_lich + ho_so)
   * Trả về dl.* + h.id_hoso nếu đã có
   */
  findByDoctor: async (id_bacsi, ngay) => {
    let sql = `
      SELECT 
        dl.id_datlich,
        dl.ten_benhnhan,
        dl.sdt,
        dl.ngay,
        dl.khung_gio,
        dl.ly_do,
        dl.trang_thai,
        h.id_hoso,
        h.trieu_chung,
        h.chuan_doan,
        h.trang_thai AS trang_thai_hs
      FROM dat_lich dl
      LEFT JOIN ho_so h ON dl.id_datlich = h.id_datlich
      WHERE dl.id_bacsi = ?
    `;
    const params = [id_bacsi];
    if (ngay) {
      sql += ` AND DATE(dl.ngay) = ?`;
      params.push(ngay);
    }
    sql += ` ORDER BY dl.ngay, dl.khung_gio;`;

    const [rows] = await db.query(sql, params);
    return rows;
  },

  updateTrangThai: async (id_datlich, trang_thai, connection) => {
    const conn = connection || db;
    const sql = `UPDATE dat_lich SET trang_thai = ? WHERE id_datlich = ?`;
    const [res] = await conn.query(sql, [trang_thai, id_datlich]);
    return res;
  }
};

module.exports = DatLich;
