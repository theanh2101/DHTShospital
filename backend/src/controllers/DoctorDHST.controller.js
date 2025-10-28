const DoctorDHSTModel = require('../models/DoctorDHST.model');

const getDoctorDHST = async (req, res) => {
  try {
    const { id_bacsi, ngay } = req.query;

    // 🧩 1️⃣ Kiểm tra đầu vào
    if (!id_bacsi) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID bác sĩ."
      });
    }

    // 🗓️ 2️⃣ Lấy danh sách lịch khám theo bác sĩ (và ngày nếu có)
    const schedules = await DoctorDHSTModel.findByDoctor(id_bacsi, ngay);

    // Nếu không có lịch khám
    if (!schedules || schedules.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Không có lịch khám nào cho bác sĩ này.",
        data: []
      });
    }

    // 👨‍⚕️ 3️⃣ Lấy thông tin bệnh nhân song song
    const fullSchedules = await Promise.all(
      schedules.map(async (lich) => {
        try {
          const patient = await DoctorDHSTModel.findPatientById(lich.id_benhnhan);
          return {
            ...lich,
            benhnhan: patient || null
          };
        } catch (err) {
          console.error(`Lỗi khi lấy bệnh nhân ${lich.id_benhnhan}:`, err);
          return { ...lich, benhnhan: null };
        }
      })
    );

    // ✅ 4️⃣ Trả kết quả
    return res.status(200).json({
      success: true,
      message: "Lấy lịch khám và thông tin bệnh nhân thành công!",
      data: fullSchedules
    });

  } catch (error) {
    console.error("❌ Lỗi tại DoctorDHST.controller:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy lịch khám.",
      error: error.message
    });
  }
};

module.exports = { getDoctorDHST };
