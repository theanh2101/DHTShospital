// models/datlichletan.model.js
// Model thao tác trực tiếp với bảng dat_lich_letan và các truy vấn hỗ trợ

const db = require("../../config/db");

const DatLichLeTanModel = {
  async getAll() {
    const sql = `
      SELECT dl.*,
             bn.ho_ten AS ten_benhnhan, bn.phone AS sdt_benhnhan,
             b.ho_ten AS ten_bacsi, k.ten_khoa, lt.ho_ten AS ten_letan
      FROM dat_lich_letan dl
      LEFT JOIN benhnhan bn ON dl.id_benhnhan = bn.id_benhnhan
      LEFT JOIN bacsi b ON dl.id_bacsi = b.id_bacsi
      LEFT JOIN khoa k ON dl.id_khoa = k.id_khoa
      LEFT JOIN letan lt ON dl.id_letan = lt.id_letan
      WHERE dl.nguon_dat = 'LeTan'
      ORDER BY dl.created_at ASC
      
    `;
    const [rows] = await db.query(sql);
    return rows;
  },

  async getByStatus(status) {
    const sql = `
      SELECT dl.*, bn.ho_ten AS ten_benhnhan, bn.phone AS sdt_benhnhan, b.ho_ten AS ten_bacsi, k.ten_khoa
      FROM dat_lich_letan dl
      LEFT JOIN benhnhan bn ON dl.id_benhnhan = bn.id_benhnhan
      LEFT JOIN bacsi b ON dl.id_bacsi = b.id_bacsi
      LEFT JOIN khoa k ON dl.id_khoa = k.id_khoa
      WHERE dl.trang_thai = ?
      AND dl.nguon_dat = 'LeTan'
      ORDER BY dl.created_at ASC
    `;
    const [rows] = await db.query(sql, [status]);
    return rows;
  },

  async getById(id) {
    const sql = `
      SELECT dl.*, bn.*, b.ho_ten AS ten_bacsi, k.ten_khoa
      FROM dat_lich_letan dl
      LEFT JOIN benhnhan bn ON dl.id_benhnhan = bn.id_benhnhan
      LEFT JOIN bacsi b ON dl.id_bacsi = b.id_bacsi
      LEFT JOIN khoa k ON dl.id_khoa = k.id_khoa
      WHERE dl.id_datlich = ?
    `;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  },

  // trả về danh sách bác sĩ theo lịch làm việc (delegate sang service/dao khác nếu cần)
  async getDoctorsBySchedule(id_khoa, ngay, ca) {
    const sql = `
      SELECT b.id_bacsi, b.ho_ten
      FROM lichlamviec l
      JOIN lichlamviec_bacsi lb ON l.id_lichlamviec = lb.id_lichlamviec
      JOIN bacsi b ON lb.id_bacsi = b.id_bacsi
      WHERE l.id_khoa = ? AND l.ngay = ? AND l.ca = ?
    `;
    const [rows] = await db.query(sql, [id_khoa, ngay, ca]);
    return rows;
  },

  // helper: tạo bệnh nhân (dùng khi lễ tân tạo hồ sơ)
  async createOrGetBenhNhan(payload, conn = null) {
    const c = conn || db;
    const id_benhnhan = payload.id_benhnhan || (`BN${Date.now().toString().slice(-6)}`);
    await c.query(
      `INSERT INTO benhnhan (id_benhnhan, ho_ten, phone, email, gioi_tinh, ngay_sinh, dia_chi, so_bhyt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_benhnhan, payload.ho_ten || 'Khách', payload.sdt, payload.email || null, payload.gioi_tinh || null,
       payload.ngay_sinh || null, payload.dia_chi || null, payload.so_bhyt || null]
    );
    const [rows] = await c.query(`SELECT * FROM benhnhan WHERE id_benhnhan = ?`, [id_benhnhan]);
    return rows[0];
  }
};

module.exports = DatLichLeTanModel;
