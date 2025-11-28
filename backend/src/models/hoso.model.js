// src/models/hoso.model.js
const db = require('../../config/db');

const HoSoModel = {
  /**
   * Tạo hồ sơ (bảng ho_so)
   * data: { id_datlich, id_benhnhan, id_bacsi, trieu_chung, chuan_doan, ghi_chu, uu_tien }
   */
  create: async (data, connection) => {
    const conn = connection || db;
    const sql = `
      INSERT INTO ho_so
        (id_datlich, id_benhnhan, id_bacsi, trieu_chung, chuan_doan, ghi_chu, trang_thai, thoi_gian_den, uu_tien, ngay_tao)
      VALUES (?, ?, ?, ?, ?, ?, 'CHO_KHAM', ?, ?, NOW())
    `;
    const params = [
      data.id_datlich || null,
      data.id_benhnhan || null,
      data.id_bacsi || null,
      data.trieu_chung || null,
      data.chuan_doan || null,
      data.ghi_chu || null,
      data.thoi_gian_den || null,
      data.uu_tien != null ? data.uu_tien : 0
    ];
    const [res] = await conn.query(sql, params);
    return { id_hoso: res.insertId, ...data };
  },

  /**
   * Tạo hồ sơ từ dat_lich với uu_tien = 1 (đặt lịch => ưu tiên)
   */
  createFromDatLichWithPriority: async (data, connection) => {
    const conn = connection || db;
    const sql = `
      INSERT INTO ho_so
        (id_datlich, id_benhnhan, id_bacsi, trieu_chung, chuan_doan, ghi_chu, trang_thai, uu_tien, ngay_tao)
      VALUES (?, ?, ?, ?, ?, ?, 'CHO_KHAM', 1, NOW())
    `;
    const params = [
      data.id_datlich,
      data.id_benhnhan,
      data.id_bacsi,
      data.trieu_chung || null,
      data.chuan_doan || null,
      data.ghi_chu || null
    ];
    const [res] = await conn.query(sql, params);
    return { id_hoso: res.insertId, ...data, uu_tien: 1 };
  },

  /**
   * Xác nhận bệnh nhân đã đến: cập nhật thoi_gian_den & trang_thai
   */
  confirmArrival: async (id_hoso, thoi_gian_den, options = {}) => {
    const conn = options.connection || db;
    const sql = `
      UPDATE ho_so
      SET thoi_gian_den = ?, trang_thai = 'CHO_KHAM'
      WHERE id_hoso = ?
    `;
    const [res] = await conn.query(sql, [thoi_gian_den, id_hoso]);
    return res;
  },

  /**
   * Lấy hồ sơ theo id
   */
  findById: async (id_hoso) => {
    const sql = `
      SELECT h.*, dl.ten_benhnhan AS ten_tam, bn.ho_ten AS benh_nhan_chinh, bn.phone, dl.ngay AS ngay_datlich, dl.khung_gio
      FROM ho_so h
      LEFT JOIN dat_lich dl ON h.id_datlich = dl.id_datlich
      LEFT JOIN benhnhan bn ON h.id_benhnhan = bn.id_benhnhan
      WHERE h.id_hoso = ?
    `;
    const [rows] = await db.query(sql, [id_hoso]);
    return rows[0] || null;
  },

  /**
   * Lấy danh sách hồ sơ cho bác sĩ, sắp xếp hợp lý:
   * uu_tien DESC, thoi_gian_den ASC, ngay_tao ASC
   * Nếu truyền ngay => lọc theo ngày (thoi_gian_den hoặc dat_lich.ngay)
   */
  findByDoctorOrdered: async (id_bacsi, ngay) => {
    let sql = `
      SELECT h.*, bn.ho_ten AS ten_benhnhan_chinh, dl.ten_benhnhan AS ten_tam_datlich
      FROM ho_so h
      LEFT JOIN benhnhan bn ON h.id_benhnhan = bn.id_benhnhan
      LEFT JOIN dat_lich dl ON h.id_datlich = dl.id_datlich
      WHERE h.id_bacsi = ?
    `;
    const params = [id_bacsi];

    if (ngay) {
      sql += ` AND (
        (h.thoi_gian_den IS NOT NULL AND DATE(h.thoi_gian_den) = ?)
        OR (h.thoi_gian_den IS NULL AND DATE(dl.ngay) = ?)
      )`;
      params.push(ngay, ngay);
    }

    sql += ` ORDER BY h.uu_tien DESC, h.thoi_gian_den ASC, h.ngay_tao ASC`;
    const [rows] = await db.query(sql, params);
    return rows;
  },

  /**
   * Utility: update trang_thai
   */
  updateTrangThai: async (id_hoso, trang_thai, connection) => {
    const conn = connection || db;
    const [res] = await conn.query("UPDATE ho_so SET trang_thai = ? WHERE id_hoso = ?", [trang_thai, id_hoso]);
    return res;
  }
};

module.exports = HoSoModel;
