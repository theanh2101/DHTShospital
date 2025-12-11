// backend/src/models/datlichletan.model.js
const db = require("../../config/db");

const DatLichLeTanModel = {
  // Lấy toàn bộ lịch tạo bởi lễ tân
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
      ORDER BY dl.created_at DESC
    `;
    const [rows] = await db.query(sql);
    return rows;
  },

  async getById(id) {
    const sql = `
      SELECT dl.*, bn.*, b.ho_ten AS ten_bacsi
      FROM dat_lich_letan dl
      LEFT JOIN benhnhan bn ON dl.id_benhnhan = bn.id_benhnhan
      LEFT JOIN bacsi b ON dl.id_bacsi = b.id_bacsi
      WHERE dl.id_datlich = ?
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  },

  // ✅ LOGIC MỚI: Tìm tất cả lịch hẹn Online theo SĐT (trả về mảng)
  async findOnlineByPhone(sdt) {
    const sql = `
      SELECT dl.*, k.ten_khoa, b.ho_ten AS ten_bacsi
      FROM dat_lich dl
      LEFT JOIN khoa k ON dl.id_khoa = k.id_khoa
      LEFT JOIN bacsi b ON dl.id_bacsi = b.id_bacsi
      WHERE dl.sdt = ? AND dl.trang_thai = 'CHO_XAC_NHAN'
      ORDER BY dl.createdAt DESC
    `;
    const [rows] = await db.query(sql, [sdt]);
    return rows; 
  },

  async insertDatLichLeTan(connection, data) {
    const conn = connection || db;
    const sql = `INSERT INTO dat_lich_letan 
      (id_letan, id_benhnhan, id_khoa, ngay, gio_hen, ca_kham, id_bacsi, ly_do, trang_thai, nguon_dat, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'LeTan', NOW())`;
    const params = [
      data.id_letan,
      data.id_benhnhan,
      data.id_khoa,
      data.ngay,
      data.gio_hen || null,
      data.ca_kham || null,
      data.id_bacsi || null,
      data.ly_do || null,
      data.trang_thai || "CHO_XAC_NHAN",
    ];
    const [result] = await conn.query(sql, params);
    return result.insertId;
  },

  async updateTrangThai(id_datlich, trang_thai, connection) {
    const conn = connection || db;
    const sql = `UPDATE dat_lich_letan SET trang_thai = ? WHERE id_datlich = ?`;
    const [res] = await conn.query(sql, [trang_thai, id_datlich]);
    return res;
  },

  // Lấy bác sĩ theo lịch làm việc
  async getDoctorsBySchedule(id_khoa, ngay, ca) {
    const sql = `
      SELECT b.id_bacsi, b.ho_ten
      FROM lichlamviec ll
      JOIN lichlamviec_bacsi llb ON ll.id_lichlamviec = llb.id_lichlamviec
      JOIN bacsi b ON b.id_bacsi = llb.id_bacsi
      WHERE ll.id_khoa = ? AND ll.ngay = ? AND ll.ca = ?
    `;
    const [rows] = await db.query(sql, [id_khoa, ngay, ca]);
    return rows;
  },

  // ✅ LOGIC MỚI QUAN TRỌNG: 
  // Tìm hoặc Tạo bệnh nhân (Phân biệt bằng TÊN nếu trùng SĐT)
  async findOrCreateBenhNhan(connection, { ho_ten, sdt, email, ngay_sinh, gioi_tinh, dia_chi }) {
    const conn = connection || db;
    
    // 1. Tìm tất cả người có cùng SĐT
    const [rows] = await conn.query("SELECT * FROM benhnhan WHERE phone = ?", [sdt]);
    
    // 2. Lọc trong danh sách đó xem có ai trùng TÊN không (so sánh không phân biệt hoa thường)
    // Trim khoảng trắng thừa
    const normalizedName = ho_ten.trim().toLowerCase();
    
    const existingPatient = rows.find(p => p.ho_ten.toLowerCase() === normalizedName);

    if (existingPatient) {
        console.log(`[DB] Đã tìm thấy bệnh nhân cũ: ${existingPatient.ho_ten} (ID: ${existingPatient.id_benhnhan})`);
        return existingPatient.id_benhnhan;
    }

    // 3. Nếu không trùng tên -> Tạo bệnh nhân MỚI (Dù trùng SĐT)
    // Ví dụ: SĐT 0988... đã có "Nguyen Van A", giờ thêm "Nguyen Van B" -> Tạo ID mới
    const id = `BN${Date.now().toString().slice(-6)}`;
    console.log(`[DB] Tạo bệnh nhân mới trùng SĐT: ${ho_ten} (ID: ${id})`);
    
    await conn.query(
      `INSERT INTO benhnhan (id_benhnhan, ho_ten, phone, email, ngay_sinh, gioi_tinh, dia_chi) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, ho_ten, sdt, email || null, ngay_sinh || null, gioi_tinh || null, dia_chi || null]
    );
    return id;
  },
};

module.exports = DatLichLeTanModel;