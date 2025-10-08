// models/khoa.model.js
const db = require("../../config/db");

const findAll = async () => {
  const [rows] = await db.query("SELECT id_khoa, ten_khoa FROM khoa ORDER BY ten_khoa ASC");
  return rows;
};

module.exports = { findAll };
