const db = require("../../config/db");
const APPOINTMENT_LIMIT_PER_SLOT = 1;

const isSlotFullForDoctor = async (ngay_dat, gio_dat, id_bacsi) => {
  try {
    const sql = `
      SELECT COUNT(*) AS count
      FROM datlich
      WHERE ngay_dat = ? AND gio_dat = ? AND id_bacsi = ? AND trang_thai != 'Huy'
    `;
    const [rows] = await db.query(sql, [ngay_dat, gio_dat, id_bacsi]);
    return rows[0].count >= APPOINTMENT_LIMIT_PER_SLOT;
  } catch (error) {
    console.error("Lỗi kiểm tra khung giờ:", error);
    throw new Error("Không thể kiểm tra lịch hẹn bác sĩ.");
  }
};

const create = async (bookingData) => {
  try {
    const { id_benhnhan, id_khoa, id_bacsi, ngay_dat, gio_dat } = bookingData;
    const sql = `
      INSERT INTO datlich (id_benhnhan, id_khoa, id_bacsi, ngay_dat, gio_dat, trang_thai)
      VALUES (?, ?, ?, ?, ?, 'Chờ xác nhận')
    `;
    const [result] = await db.query(sql, [id_benhnhan, id_khoa, id_bacsi, ngay_dat, gio_dat]);
    return result.insertId;
  } catch (error) {
    console.error("Lỗi tạo lịch hẹn:", error);
    throw new Error("Không thể tạo lịch hẹn mới.");
  }
};

const findById = async (id_datlich) => {
  try {
    const sql = `
      SELECT
          dl.id_datlich,
          bn.ho_ten AS ten_benhnhan,
          COALESCE(bn.phone, '') AS sdt_benhnhan,
          k.ten_khoa,
          bs.ho_ten AS ten_bacsi,
          dl.ngay_dat,
          dl.gio_dat,
          dl.trang_thai
      FROM datlich dl
      JOIN benhnhan bn ON dl.id_benhnhan = bn.id_benhnhan
      JOIN khoa k ON dl.id_khoa = k.id_khoa
      JOIN bacsi bs ON dl.id_bacsi = bs.id_bacsi
      WHERE dl.id_datlich = ?
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [id_datlich]);
    return rows[0];
  } catch (error) {
    console.error("Lỗi truy vấn chi tiết lịch hẹn:", error);
    throw new Error("Không thể lấy thông tin lịch hẹn.");
  }
};

module.exports = { create, isSlotFullForDoctor, findById };
