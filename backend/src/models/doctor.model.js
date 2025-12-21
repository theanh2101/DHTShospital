const db = require("../../config/db");

const DoctorModel = {
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT 
        id_bacsi,
        ho_ten,
        hoc_vi,
        chuc_vu,
        chuyen_mon,
        hinh_anh
      FROM bacsi
    `);
    return rows;
  },

  searchByName: async (keyword) => {
    const [rows] = await db.query(`
      SELECT 
        id_bacsi,
        ho_ten,
        hoc_vi,
        chuc_vu,
        chuyen_mon,
        hinh_anh
      FROM bacsi
      WHERE ho_ten LIKE ?
    `, [`%${keyword}%`]);

    return rows;
  }
};

module.exports = DoctorModel;
