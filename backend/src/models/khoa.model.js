// models/khoa.model.js
const pool = require("../../config/db");

const Khoa = {
  getAll: async () => {
    const [rows] = await pool.query("SELECT id_khoa, ten_khoa, mo_ta FROM khoa");
    return rows;
  }
};

module.exports = Khoa;
