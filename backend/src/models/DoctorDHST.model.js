const db = require("../../config/db");

const DoctorDHSTModel = {
  /**
   * 🔹 Lấy danh sách lịch khám theo bác sĩ (và ngày nếu có)
   * Gồm cả thông tin bệnh nhân từ dat_lich hoặc từ ho_so_kham (nếu đã tạo hồ sơ)
   */
  async findByDoctor(id_bacsi, ngay = null) {
    try {
      let sql = `
        SELECT 
          dl.id_datlich,
          dl.ten_benhnhan,
          dl.sdt,
          dl.email,
          dl.ngay,
          dl.khung_gio,
          dl.ly_do,
          dl.trang_thai AS trang_thai_datlich,
          b.ho_ten AS ten_bacsi,
          k.ten_khoa
        FROM dat_lich AS dl
        LEFT JOIN bacsi AS b ON dl.id_bacsi = b.id_bacsi
        LEFT JOIN khoa AS k ON dl.id_khoa = k.id_khoa
        WHERE dl.id_bacsi = ?
      `;

      const params = [id_bacsi];

      // 🗓️ Nếu có lọc theo ngày
      if (ngay) {
        sql += " AND DATE(dl.ngay) = ?";
        params.push(ngay);
      }

      sql += " ORDER BY dl.ngay DESC, dl.khung_gio ASC";

      const [rows] = await db.query(sql, params);
      console.log("📩 DoctorDHSTModel.findByDoctor:", rows.length, "kết quả");
      return rows || [];
    } catch (error) {
      console.error("❌ Lỗi tại DoctorDHSTModel.findByDoctor:", error.message);
      throw error;
    }
  },

  /**
   * 🔹 Lấy thông tin chi tiết bệnh nhân theo ID (trong ho_so_kham → benhnhan)
   */
  async findPatientById(id_benhnhan) {
    try {
      const [rows] = await db.query(
        `
        SELECT 
          id_benhnhan,
          ho_ten,
          phone,
          email,
          gioi_tinh,
          ngay_sinh,
          dia_chi,
          so_bhyt
        FROM benhnhan
        WHERE id_benhnhan = ?
        `,
        [id_benhnhan]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("❌ Lỗi tại DoctorDHSTModel.findPatientById:", error.message);
      throw error;
    }
  },

  /**
   * 🔹 Lấy hồ sơ khám theo ID đặt lịch
   */
  async findHoSoByDatLich(id_datlich) {
    try {
      const [rows] = await db.query(
        `
        SELECT 
          hs.id_hoso,
          hs.id_benhnhan,
          hs.trieu_chung,
          hs.chuan_doan,
          hs.ghi_chu,
          hs.trang_thai,
          hs.ngay_tao
        FROM ho_so_kham AS hs
        WHERE hs.id_datlich = ?
        LIMIT 1
        `,
        [id_datlich]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("❌ Lỗi tại DoctorDHSTModel.findHoSoByDatLich:", error.message);
      throw error;
    }
  },
};

module.exports = DoctorDHSTModel;
