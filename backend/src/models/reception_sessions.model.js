// src/models/reception_sessions.model.js
const db = require("../../config/db");

/**
 * Lưu lại phiên giao dịch của lễ tân
 * @param {number} id_datlich - ID lịch hẹn
 * @param {string} id_letan - ID lễ tân
 * @param {string} loai_giao_dich - ví dụ: 'TAO_HOSO', 'CHECKIN', 'HUY_LICH'
 */
exports.createSession = async (id_datlich, id_letan, loai_giao_dich) => {
  try {
    const sql = `
      INSERT INTO reception_sessions (id_datlich, id_letan, loai_giao_dich, ngay_thuc_hien)
      VALUES (?, ?, ?, NOW())
    `;
    await db.query(sql, [id_datlich, id_letan, loai_giao_dich]);
  } catch (err) {
    console.error("❌ Lỗi createSession:", err.message);
  }
};
