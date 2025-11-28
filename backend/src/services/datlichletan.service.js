const db = require("../../config/db");
const DatLichLeTanModel = require("../models/datlichletan.model");

const DatLichLeTanService = {
  // ==========================
  // 🟢 Lấy danh sách bác sĩ theo lịch làm việc
  // ==========================
  async getDoctorsBySchedule(id_khoa, ngay, ca) {
    return await DatLichLeTanModel.getDoctorsBySchedule(id_khoa, ngay, ca);
  },

  // ==========================
  // 🟡 Tạo hồ sơ & đặt lịch (Lễ tân tạo mới)
  // ==========================
  async create(payload) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1) kiểm tra hoặc tạo bệnh nhân
      const [existing] = await conn.query(`SELECT id_benhnhan FROM benhnhan WHERE phone = ?`, [payload.sdt]);
      let id_benhnhan;
      if (existing.length) {
        id_benhnhan = existing[0].id_benhnhan;
      } else {
        id_benhnhan = 'BN' + Date.now().toString().slice(-6);
        await conn.query(
          `INSERT INTO benhnhan (id_benhnhan, ho_ten, phone, email, gioi_tinh, ngay_sinh, dia_chi, so_bhyt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id_benhnhan, payload.ho_ten || 'Khách', payload.sdt, payload.email || null, payload.gio_tinh || null,
           payload.ngay_sinh || null, payload.dia_chi || null, payload.so_bhyt || null]
        );
      }

      // 2) tạo bản ghi đặt lịch tại lễ tân
      const insertSql = `INSERT INTO dat_lich_letan (id_letan, id_benhnhan, id_khoa, ngay, gio_hen, ca_kham, id_bacsi, ly_do, trang_thai, nguon_dat, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DA_TAO_HOSO', 'LeTan', NOW())`;
      await conn.query(insertSql, [
        payload.id_letan, id_benhnhan, payload.id_khoa, payload.ngay_hen || payload.ngay, payload.gio_hen || null,
        payload.ca_kham, payload.id_bacsi, payload.ly_do || null
      ]);

      // 3) log phiên giao dịch lễ tân
      await conn.query(`INSERT INTO reception_sessions (id_letan, id_datlich, loai_giao_dich) VALUES (?, ?, 'TAO_HOSO')`, [
        payload.id_letan, null
      ]);

      await conn.commit();
      return { success: true, message: "Tạo hồ sơ & đặt lịch thành công." };
    } catch (err) {
      await conn.rollback();
      console.error("DatLichLeTanService.create error:", err);
      throw err;
    } finally {
      conn.release();
    }
  },

  // ==========================
  // 🔵 Check-in bằng SĐT: lấy dữ liệu từ dat_lich (online) để điền form lễ tân
  // ==========================
  async checkinByPhone({ sdt, id_letan }) {
    const conn = await db.getConnection();
    try {
      // tìm lịch online gần nhất theo SĐT
      const [rows] = await conn.query(`SELECT * FROM dat_lich WHERE sdt = ? ORDER BY createdAt DESC LIMIT 1`, [sdt]);
      if (!rows.length) return { success: false, message: "Không tìm thấy lịch online nào cho số này." };
      const info = rows[0];

      // Optionally, we can return the found dat_lich record so frontend có thể điền form
      // Log phiên checkin
      await conn.query(`INSERT INTO reception_sessions (id_letan, id_datlich, loai_giao_dich) VALUES (?, ?, 'CHECKIN')`, [
        id_letan || null, null
      ]);

      return { success: true, data: info };
    } catch (err) {
      console.error("DatLichLeTanService.checkinByPhone error:", err);
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = DatLichLeTanService;
