const db = require("../config/db"); // pool MySQL2

// 1️⃣ Lấy lịch khám của bác sĩ, có thể lọc theo ngày
async function getSchedule(id_bacsi, ngay = null) {
  try {
    let sql = `SELECT l.id_lichkham, bn.id_benhnhan, bn.hoten AS ten_benhnhan, 
               l.ngaykham, l.giohen, l.ca, l.trangthai
               FROM lichkham l
               JOIN benhnhan bn ON l.id_benhnhan = bn.id_benhnhan
               WHERE l.id_bacsi = ?`;
    const params = [id_bacsi];
    if (ngay) {
      sql += " AND l.ngaykham = ?";
      params.push(ngay);
    }
    const [rows] = await db.promise().query(sql, params);
    return rows;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// 2️⃣ Lấy chi tiết bệnh nhân
async function getPatientDetail(id_benhnhan) {
  try {
    const [rows] = await db.promise().query(
      `SELECT hoten, gioitinh, ngaysinh, diachi, chuandoan, donthuoc
       FROM benhnhan WHERE id_benhnhan = ?`,
      [id_benhnhan]
    );
    return rows[0] || null;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// 3️⃣ Cập nhật trạng thái lịch khám
async function updateStatus(id_lichkham, trangthai) {
  try {
    const [result] = await db.promise().query(
      `UPDATE lichkham SET trangthai = ? WHERE id_lichkham = ?`,
      [trangthai, id_lichkham]
    );
    return result.affectedRows;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// 4️⃣ Cập nhật bệnh án (chuẩn đoán + đơn thuốc)
async function updatePatient(id_benhnhan, chuandoan, donthuoc) {
  try {
    const [result] = await db.promise().query(
      `UPDATE benhnhan SET chuandoan = ?, donthuoc = ? WHERE id_benhnhan = ?`,
      [chuandoan, donthuoc, id_benhnhan]
    );
    return result.affectedRows;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = {
  getSchedule,
  getPatientDetail,
  updateStatus,
  updatePatient
};
