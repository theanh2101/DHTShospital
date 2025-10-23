// src/controllers/listdoctor.controller.js (ĐÃ SỬA)
const ListDoctor = require("../models/listdoctor.model");

// Hàm này là một hàm bất đồng bộ (async function)
// để có thể sử dụng await bên trong.

// 1️⃣ Lấy danh sách bác sĩ
exports.getAllDoctors = async (req, res) => {
    try {
        // Sử dụng await để chờ kết quả Promise từ Model
        const data = await ListDoctor.getAll();
        res.json(data);
    } catch (err) {
        // Bắt lỗi từ throw err; trong Model và trả về lỗi 500
        console.error("Lỗi server khi lấy danh sách bác sĩ:", err.message);
        res.status(500).json({ 
            message: "Lỗi server khi truy vấn danh sách bác sĩ.", 
            error: err.message || "Lỗi Database" 
        });
    }
};

// 2️⃣ Lấy chi tiết bác sĩ theo id_bacsi
exports.getDoctorById = async (req, res) => {
    try {
        const id = req.params.id_bacsi;
        const data = await ListDoctor.getById(id);

        if (!data) {
            return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
        }
        res.json(data);
    } catch (err) {
        console.error("Lỗi server khi lấy chi tiết bác sĩ:", err.message);
        res.status(500).json({ 
            message: "Lỗi server khi lấy chi tiết bác sĩ.", 
            error: err.message || "Lỗi Database" 
        });
    }
};

// 3️⃣ Cập nhật thông tin bác sĩ (KHÔNG CHO SỬA HO_TEN)
exports.updateDoctor = async (req, res) => {
    const id = req.params.id_bacsi;
    const updateData = req.body;

    // Không cho sửa tên
    if (updateData.ho_ten) {
        return res.status(400).json({ message: "Không được phép sửa tên bác sĩ" });
    }

    try {
        // 1. Kiểm tra trạng thái hồ sơ trước khi cập nhật
        const doctor = await ListDoctor.getById(id);

        if (!doctor) {
            return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
        }

        // Giả sử thuộc tính khóa là 'trangthai' trong DB (0: Khóa, 1: Mở)
        // Dựa trên hàm lock trong Model bạn cung cấp: [isLocked ? 0 : 1]
        // Nếu trangthai là 0 (Đã khóa), thì không cho cập nhật
        if (doctor.trangthai === 0) { 
            return res.status(403).json({ message: "Hồ sơ đã bị khóa, không thể chỉnh sửa" });
        }

        // 2. Tiến hành cập nhật
        const result = await ListDoctor.update(id, updateData);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy bác sĩ để cập nhật" });
        }

        res.json({ message: "Cập nhật thành công", result });
    } catch (err) {
        console.error("Lỗi server khi cập nhật bác sĩ:", err.message);
        res.status(500).json({ 
            message: "Lỗi server khi cập nhật thông tin bác sĩ.", 
            error: err.message || "Lỗi Database" 
        });
    }
};

// 4️⃣ Khóa / mở khóa hồ sơ bác sĩ
exports.lockDoctor = async (req, res) => {
    const id = req.params.id_bacsi;
    // Lấy giá trị boolean từ body, mặc định là false nếu không có
    const isLocked = req.body.isLocked === true; 

    try {
        const result = await ListDoctor.lock(id, isLocked);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy bác sĩ để khóa/mở khóa" });
        }
        
        res.json({
            message: isLocked ? "Đã khóa hồ sơ bác sĩ thành công" : "Đã mở khóa hồ sơ bác sĩ thành công",
        });
    } catch (err) {
        console.error("Lỗi server khi khóa/mở khóa hồ sơ:", err.message);
        res.status(500).json({ 
            message: "Lỗi server khi cập nhật trạng thái hồ sơ.", 
            error: err.message || "Lỗi Database" 
        });
    }
};

module.exports = exports;