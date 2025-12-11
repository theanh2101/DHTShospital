// backend/src/services/datlichletan.service.js
const db = require("../../config/db");
const DatLichLeTanModel = require("../models/datlichletan.model");
const pool = require("../../config/db");

const DatLichLeTanService = {
  // Round-robin load balancing
  // ĐÃ SỬA: Chỉ lấy bác sĩ có trong lịch làm việc của Ngày và Ca đó
  async getDoctorsRoundRobin(id_khoa, ngay, ca_kham) {
    const conn = await pool.getConnection();
    try {
      // BƯỚC 1: Lấy danh sách bác sĩ ĐƯỢC PHÂN CÔNG trong ngày và ca này
      // (Thay vì lấy toàn bộ bác sĩ của khoa)
      const doctors = await DatLichLeTanModel.getDoctorsBySchedule(id_khoa, ngay, ca_kham);

      // Nếu không có bác sĩ nào trực ca này, trả về rỗng ngay
      if (!doctors || doctors.length === 0) return [];

      // BƯỚC 2: Đếm số lượng bệnh nhân hiện tại của từng bác sĩ trong ca đó để cân bằng tải
      const [countRows] = await conn.query(
        `SELECT id_bacsi, COUNT(*) as so_lich 
         FROM dat_lich_letan 
         WHERE id_khoa = ? AND ngay = ? AND ca_kham = ? 
         GROUP BY id_bacsi`,
        [id_khoa, ngay, ca_kham]
      );

      // Tạo map đếm số lịch: { 'BS001': 2, 'BS002': 0 }
      const countMap = {};
      countRows.forEach(r => countMap[r.id_bacsi] = r.so_lich);

      // Gán số lịch vào danh sách bác sĩ lấy được ở Bước 1
      doctors.forEach(d => { d.so_lich = countMap[d.id_bacsi] || 0; });

      // Sắp xếp bác sĩ theo số lịch tăng dần (ưu tiên người ít việc hơn)
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
      
      // 1) Tìm hoặc tạo bệnh nhân (Logic mới hỗ trợ trùng SĐT khác tên)
      const id_benhnhan = await DatLichLeTanModel.findOrCreateBenhNhan(conn, {
        ho_ten: payload.ho_ten,
        sdt: payload.sdt,
        email: payload.email,
        ngay_sinh: payload.ngay_sinh,
        gioi_tinh: payload.gioi_tinh,
        dia_chi: payload.dia_chi,
      });

      // 2) Tự động chọn bác sĩ nếu chưa có
      let id_bacsi_final = payload.id_bacsi || null;
      if (!id_bacsi_final) {
        // Gọi hàm đã sửa ở trên để tìm bác sĩ trực
        const doctors = await this.getDoctorsRoundRobin(payload.id_khoa, payload.ngay, payload.ca_kham);
        if (!doctors.length) throw new Error("Không có bác sĩ nào trực trong ca này.");
        id_bacsi_final = doctors[0].id_bacsi;
      }

      // 3) Insert lịch
      // LƯU Ý: payload.id_letan bắt buộc phải tồn tại trong bảng 'letan' của DB
      // nếu không sẽ bị lỗi Foreign Key Constraint như bạn gặp phải.
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
      
      // 5) Log phiên giao dịch
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

  // ✅ LOGIC MỚI: Check-in trả về TẤT CẢ kết quả khớp SĐT
  async checkinByPhone({ sdt }) {
    if (!sdt) throw new Error("Thiếu SĐT");

    // 1. Tìm các đơn đặt lịch Online (Chờ xác nhận)
    const onlineAppointments = await DatLichLeTanModel.findOnlineByPhone(sdt);
    
    // 2. Tìm danh sách hồ sơ bệnh nhân cũ trong DB
    const [patients] = await db.query(`SELECT * FROM benhnhan WHERE phone = ?`, [sdt]);

    return {
        online: onlineAppointments, // Mảng lịch online
        patients: patients          // Mảng bệnh nhân cũ
    };
  },

  async getAll() { return await DatLichLeTanModel.getAll(); },
};

module.exports = DatLichLeTanService;