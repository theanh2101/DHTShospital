const DoctorModel = require("../models/doctor.model");

/* Convert ảnh sang base64 */
const formatDoctor = (d) => ({
  ...d,
  hinh_anh: d.hinh_anh
    ? `data:image/png;base64,${Buffer.from(d.hinh_anh).toString("base64")}`
    : null
});

/* GET ALL */
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await DoctorModel.getAll();
    const result = doctors.map(formatDoctor);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi lấy danh sách bác sĩ" });
  }
};

/* SEARCH */
exports.searchDoctors = async (req, res) => {
  try {
    const q = req.query.q || "";
    const doctors = await DoctorModel.searchByName(q);
    const result = doctors.map(formatDoctor);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi tìm bác sĩ" });
  }
};
