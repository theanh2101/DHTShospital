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

  // Chỉ lấy lịch có trạng thái CHO_XAC_NHAN
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

  async findOrCreateBenhNhan(connection, { ho_ten, sdt, email, ngay_sinh, gioi_tinh, dia_chi }) {
    const conn = connection || db;
    const [rows] = await conn.query("SELECT * FROM benhnhan WHERE phone = ?", [sdt]);
    const normalizedName = ho_ten.trim().toLowerCase();
    const existingPatient = rows.find(p => p.ho_ten.toLowerCase() === normalizedName);

    if (existingPatient) {
        return existingPatient.id_benhnhan;
    }

    const id = `BN${Date.now().toString().slice(-6)}`;
    await conn.query(
      `INSERT INTO benhnhan (id_benhnhan, ho_ten, phone, email, ngay_sinh, gioi_tinh, dia_chi) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, ho_ten, sdt, email || null, ngay_sinh || null, gioi_tinh || null, dia_chi || null]
    );
    return id;
  },
};

module.exports = DatLichLeTanModel;