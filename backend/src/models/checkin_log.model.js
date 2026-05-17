// src/models/checkin_log.model.js
const db = require("../../config/db");

/**
 * Ghi log check-in của bệnh nhân (do lễ tân thao tác)
 * @param {number} id_datlich - ID lịch hẹn
 * @param {string} id_letan - ID lễ tân
 */
exports.logCheckin = async (id_datlich, id_letan) => {
  try {
    const sql = `
      INSERT INTO checkin_log (id_datlich, id_letan, thoi_gian_checkin)
      VALUES (?, ?, NOW())
    `;
    await db.query(sql, [id_datlich, id_letan]);
  } catch (err) {
    console.error("❌ Lỗi logCheckin:", err.message);
  }
};
