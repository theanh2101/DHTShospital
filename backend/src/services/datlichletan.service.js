const db = require("../../config/db");
const DatLichLeTanModel = require("../models/datlichletan.model");
const pool = require("../../config/db");

const DatLichLeTanService = {
  // Round-robin load balancing
  async getDoctorsRoundRobin(id_khoa, ngay, ca_kham) {
    const conn = await pool.getConnection();
    try {
      const doctors = await DatLichLeTanModel.getDoctorsBySchedule(id_khoa, ngay, ca_kham);
      if (!doctors || doctors.length === 0) return [];

      const [countRows] = await conn.query(
        `SELECT id_bacsi, COUNT(*) as so_lich 
         FROM dat_lich_letan 
         WHERE id_khoa = ? AND ngay = ? AND ca_kham = ? 
         GROUP BY id_bacsi`,
        [id_khoa, ngay, ca_kham]
      );

      const countMap = {};
      countRows.forEach(r => countMap[r.id_bacsi] = r.so_lich);
      doctors.forEach(d => { d.so_lich = countMap[d.id_bacsi] || 0; });
      doctors.sort((a, b) => a.so_lich - b.so_lich);

      return doctors;
    } finally {
      conn.release();
    }
  },

  async getDoctorsBySchedule(id_khoa, ngay, ca) {
    return await this.getDoctorsRoundRobin(id_khoa, ngay, ca);
  },

  async create(payload) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      // 1) Tìm hoặc tạo bệnh nhân (Kèm BHYT)
      const id_benhnhan = await DatLichLeTanModel.findOrCreateBenhNhan(conn, {
        ho_ten: payload.ho_ten,
        sdt: payload.sdt,
        email: payload.email,
        ngay_sinh: payload.ngay_sinh,
        gioi_tinh: payload.gioi_tinh,
        dia_chi: payload.dia_chi,
        so_bhyt: payload.so_bhyt // ✅ Truyền BHYT
      });

      // 2) Tự động chọn bác sĩ
      let id_bacsi_final = payload.id_bacsi || null;
      if (!id_bacsi_final) {
        const doctors = await this.getDoctorsRoundRobin(payload.id_khoa, payload.ngay, payload.ca_kham);
        if (!doctors.length) throw new Error("Không có bác sĩ nào trực trong ca này.");
        id_bacsi_final = doctors[0].id_bacsi;
      }

      // 3) Insert lịch
      const insertId = await DatLichLeTanModel.insertDatLichLeTan(conn, {
        ...payload,
        id_benhnhan,
        id_bacsi: id_bacsi_final,
        trang_thai: "DA_TAO_HOSO"
      });

      // 4) Tạo hồ sơ
      const [hsRes] = await conn.query(
        `INSERT INTO ho_so_kham (id_datlich, id_benhnhan, id_bacsi, trang_thai, ngay_tao) VALUES (?, ?, ?, 'CHO_KHAM', NOW())`,
        [insertId, id_benhnhan, id_bacsi_final]
      );
      
      await conn.query(`UPDATE dat_lich_letan SET id_hoso = ? WHERE id_datlich = ?`, [hsRes.insertId, insertId]);

      // 5) Xử lý xóa lịch Online (nếu có)
      if (payload.id_datlich_online) {
          console.log("Hoàn tất lịch Online:", payload.id_datlich_online);
          await conn.query(
              `UPDATE dat_lich SET trang_thai = 'DA_TAO_HOSO' WHERE id_datlich = ?`,
              [payload.id_datlich_online]
          );
      }
      
      // 6) Log phiên giao dịch
      await conn.query(
        `INSERT INTO reception_sessions (id_letan, id_datlich, loai_giao_dich, ngay_thuc_hien) VALUES (?, ?, 'TAO_HOSO', NOW())`,
        [payload.id_letan, insertId]
      );

      await conn.commit();
      return { id_datlich: insertId, id_hoso: hsRes.insertId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async checkinByPhone({ sdt }) {
    if (!sdt) throw new Error("Thiếu SĐT");
    const onlineAppointments = await DatLichLeTanModel.findOnlineByPhone(sdt);
    const [patients] = await db.query(`SELECT * FROM benhnhan WHERE phone = ?`, [sdt]);
    return {
        online: onlineAppointments,
        patients: patients
    };
  },

  async getAll() { return await DatLichLeTanModel.getAll(); },
};

module.exports = DatLichLeTanService;