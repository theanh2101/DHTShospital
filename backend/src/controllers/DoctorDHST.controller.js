const DoctorDHSTModel = require('../models/DoctorDHST.model');

const getDoctorDHST = async (req, res) => {
    try {
        const { id_bacsi, ngay } = req.query;

        if (!id_bacsi) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ID bác sĩ."
            });
        }

        // Lấy danh sách lịch khám
        const schedules = await DoctorDHSTModel.findByDoctor(id_bacsi, ngay);

        // Gắn thông tin bệnh nhân cho từng lịch
        const fullSchedules = [];
        for (const lich of schedules) {
            const patient = await DoctorDHSTModel.findPatientById(lich.id_benhnhan);
            fullSchedules.push({
                ...lich,
                benhnhan: patient || {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Lấy lịch khám và thông tin bệnh nhân thành công!",
            data: fullSchedules
        });

    } catch (error) {
        console.error("❌ Lỗi tại DoctorDHST.controller:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi máy chủ khi lấy lịch khám."
        });
    }
};

module.exports = { getDoctorDHST };
