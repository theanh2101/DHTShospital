const DoctorDHSTModel = require("../models/DoctorDHST.model");

const getDoctorDHST = async (req, res) => {
  try {
    const { id_bacsi, ngay } = req.query;

    // 1️⃣ Kiểm tra đầu vào
    if (!id_bacsi?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID bác sĩ (id_bacsi).",
      });
    }

    // 2️⃣ Lấy danh sách lịch khám theo bác sĩ (và ngày nếu có)
    const schedules = await DoctorDHSTModel.findByDoctor(id_bacsi, ngay);

    // 3️⃣ Nếu không có lịch khám
    if (!schedules?.length) {
      return res.status(200).json({
        success: true,
        message: "Không có lịch khám nào cho bác sĩ này.",
        data: [],
      });
    }

    // 4️⃣ Lấy thông tin bệnh nhân song song (Promise.all để tối ưu hiệu năng)
    const fullSchedules = await Promise.all(
      schedules.map(async (lich) => {
        const patient = await DoctorDHSTModel.findPatientById(lich.id_benhnhan);
        return {
          ...lich,
          benhnhan: patient ?? null,
        };
      })
    );

    // ✅ 5️⃣ Trả kết quả chuẩn REST
    res.status(200).json({
      success: true,
      total: fullSchedules.length,
      message: "Lấy lịch khám và thông tin bệnh nhân thành công.",
      data: fullSchedules,
    });
  } catch (error) {
    console.error("❌ Lỗi tại DoctorDHST.controller:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy lịch khám.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = { getDoctorDHST };
