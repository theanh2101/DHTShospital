// src/services/roundrobin.service.js
const db = require("../../config/db");

/**
 * 🔁 Lấy bác sĩ tiếp theo theo luật Round Robin
 * @param {string} id_khoa - ID khoa
 * @param {string} ngay - Ngày khám (YYYY-MM-DD)
 * @param {string} ca - Ca khám (Sang/Chieu)
 * @returns {string|null} id_bacsi
 */
exports.getNextDoctor = async (id_khoa, ngay, ca) => {
  try {
    const [rows] = await db.query(`
      SELECT b.id_bacsi
      FROM bacsi b
      LEFT JOIN dat_lich_letan d 
        ON b.id_bacsi = d.id_bacsi
        AND d.ngay = ? 
        AND d.ca_kham = ?
      WHERE b.id_khoa = ?
      GROUP BY b.id_bacsi
      ORDER BY COUNT(d.id_datlich) ASC
      LIMIT 1
    `, [ngay, ca, id_khoa]);
    return rows.length ? rows[0].id_bacsi : null;
  } catch (err) {
    console.error("❌ Lỗi Round Robin:", err.message);
    return null;
  }
};
