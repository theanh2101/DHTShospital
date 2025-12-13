// ... (các require khác)
const ThongkeModel = require('../models/thongke.model'); 

exports.getPatientCountByDay = async (req, res) => {
    try {
        // Lấy tham số từ Query String (URL: ?startDate=...&endDate=...&id_khoa=...)
        const { startDate, endDate, id_khoa } = req.query;

        console.log(`[ThongKe] Truy vấn từ: ${startDate} đến: ${endDate}. Khoa: ${id_khoa || 'Tất cả'}`); // 👈 Thêm dòng này

        if (!startDate || !endDate) {
            return res.status(400).json({ 
                message: "Thiếu tham số startDate hoặc endDate.", 
                data: [] 
            });
        }
        
        const patientCounts = await ThongkeModel.fetchPatientCounts(startDate, endDate, id_khoa);

        res.status(200).json(patientCounts); 
        
    } catch (error) {
        console.error("Lỗi Controller getPatientCountByDay:", error.message);
        res.status(500).json({ 
            message: "Lỗi server khi lấy dữ liệu thống kê.",
            details: error.message,
            data: []
        });
    }
};