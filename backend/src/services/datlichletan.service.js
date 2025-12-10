// backend/src/services/datlichletan.service.js
const db = require("../../config/db");
const DatLichLeTanModel = require("../models/datlichletan.model");
const pool = require("../../config/db");

const DatLichLeTanService = {

  /**
   * Lấy danh sách bác sĩ + số lịch của họ trong ngày/ca => phục vụ round-robin
   */
  async getDoctorsRoundRobin(id_khoa, ngay, ca_kham) {
    const conn = await pool.getConnection();
    try {
      // 1) Lấy danh sách bác sĩ của khoa
      const [doctors] = await conn.query(
        `SELECT id_bacsi, ho_ten 
         FROM bacsi 
         WHERE id_khoa = ?`,
        [id_khoa]
      );

      if (!doctors.length) return [];

      // 2) Đếm số lịch mỗi bác sĩ đang có trong ngày + ca
      const [countRows] = await conn.query(
        `SELECT id_bacsi, COUNT(*) as so_lich
         FROM dat_lich_letan
         WHERE id_khoa = ? AND ngay = ? AND ca_kham = ?
         GROUP BY id_bacsi`,
        [id_khoa, ngay, ca_kham]
      );

      const countMap = {};
      countRows.forEach(r => countMap[r.id_bacsi] = r.so_lich);

      // 3) Thêm số lịch vào object bác sĩ
      doctors.forEach(d => {
        d.so_lich = countMap[d.id_bacsi] || 0;
      });

      // 4) Sắp xếp người ít lịch nhất lên đầu (round-robin by load)
      doctors.sort((a, b) => a.so_lich - b.so_lich);

      return doctors;

    } finally {
      conn.release();
    }
  },

  /**
   * Lễ tân load danh sách bác sĩ (frontend để hiển thị)
   */
  async getDoctorsBySchedule(id_khoa, ngay, ca) {
    // Trả danh sách bác sĩ sorted theo round robin
    return await this.getDoctorsRoundRobin(id_khoa, ngay, ca);
  },

  /**
   * Tạo lịch từ lễ tân
   * Nếu id_bacsi không truyền → tự chọn theo round-robin
   */
  async create(payload) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1) tìm hoặc tạo bệnh nhân
      const id_benhnhan = await DatLichLeTanModel.findOrCreateBenhNhan(conn, {
        ho_ten: payload.ho_ten,
        sdt: payload.sdt,
        email: payload.email,
        ngay_sinh: payload.ngay_sinh,
        gioi_tinh: payload.gioi_tinh,
        dia_chi: payload.dia_chi,
      });

      // 2) Nếu lễ tân KHÔNG chọn bác sĩ → gán tự động theo round robin
      let id_bacsi_final = payload.id_bacsi || null;

      if (!id_bacsi_final) {
        const doctors = await this.getDoctorsRoundRobin(
          payload.id_khoa,
          payload.ngay,
          payload.ca_kham
        );

        if (!doctors.length)
          throw new Error("Không có bác sĩ nào phù hợp để phân công.");

        id_bacsi_final = doctors[0].id_bacsi; // chọn bác sĩ ít lịch nhất
      }

      // 3) Insert dat_lich_letan
      const datLichData = {
        id_letan: payload.id_letan,
        id_benhnhan,
        id_khoa: payload.id_khoa,
        ngay: payload.ngay,
        gio_hen: payload.gio_hen || null,
        ca_kham: payload.ca_kham,
        id_bacsi: id_bacsi_final,
        ly_do: payload.ly_do || null,
        trang_thai: "DA_TAO_HOSO",
      };

      const insertId = await DatLichLeTanModel.insertDatLichLeTan(conn, datLichData);

      // 4) Tạo hồ sơ khám
      const [hsRes] = await conn.query(
        `INSERT INTO ho_so_kham (id_datlich, id_benhnhan, id_bacsi, trang_thai, ngay_tao)
         VALUES (?, ?, ?, 'CHO_KHAM', NOW())`,
        [insertId, id_benhnhan, id_bacsi_final]
      );

      const id_hoso = hsRes.insertId;

      // 5) Cập nhật id_hoso vào dat_lich
      await conn.query(
        `UPDATE dat_lich_letan SET id_hoso = ? WHERE id_datlich = ?`,
        [id_hoso, insertId]
      );

      // 6) Log session lễ tân
      await conn.query(
        `INSERT INTO reception_sessions (id_letan, id_datlich, loai_giao_dich, ngay_thuc_hien)
         VALUES (?, ?, 'TAO_HOSO', NOW())`,
        [payload.id_letan, insertId]
      );

      await conn.commit();
      return { id_datlich: insertId, id_hoso };

    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Check-in theo SĐT
   */
  async checkinByPhone({ sdt }) {
    if (!sdt) throw new Error("Thiếu SĐT");

    // ưu tiên lịch online
    const online = await DatLichLeTanModel.findOnlineByPhone(sdt);
    if (online) return { type: "online", data: online };

    // nếu không có, tìm bệnh nhân trong DB
    const [bn] = await db.query(
      `SELECT * FROM benhnhan WHERE phone = ? LIMIT 1`,
      [sdt]
    );

    if (bn.length) return { type: "patient", data: bn[0] };

    return null;
  },

  async getAll() { return await DatLichLeTanModel.getAll(); },
  async getById(id) { return await DatLichLeTanModel.getById(id); },
  async getByStatus(status) { return await DatLichLeTanModel.getByStatus(status); },

};

module.exports = DatLichLeTanService;
