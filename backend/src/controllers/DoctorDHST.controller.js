// controllers/DoctorDHST.controller.js
const DoctorDHSTService = require('../services/DoctorDHST.service');
const db = require('../../config/db');

const service = new DoctorDHSTService(db);

// =========================================================
// 1. QUẢN LÝ BÁC SĨ & LỊCH TRÌNH
// =========================================================

exports.getBacsiIdFromTaikhoan = async (req, res) => {
    const { id_taikhoan } = req.query;
    if (!id_taikhoan) return res.status(400).send({ error: "Thiếu id_taikhoan." });
    try {
        const [rows] = await db.query(`SELECT id_bacsi FROM bacsi WHERE id_taikhoan = ? LIMIT 1`, [id_taikhoan]);
        if (!rows || rows.length === 0) return res.status(404).send({ error: "Không tìm thấy bác sĩ." });
        res.status(200).json({ data: { id_bacsi: rows[0].id_bacsi } });
    } catch (error) {
        res.status(500).send({ error: "Lỗi server." });
    }
};

exports.getDoctorProfile = async (req, res) => {
    const { id_bacsi } = req.query;
    try {
        const profile = await service.getProfile(id_bacsi);
        if (!profile) return res.status(404).send({ error: "Không tìm thấy bác sĩ." });
        res.status(200).json({ data: profile });
    } catch (error) {
        res.status(500).send({ error: "Lỗi server." });
    }
};

exports.updateDoctorProfile = async (req, res) => {
    try {
        await service.updateProfile(req.body);
        res.status(200).json({ success: true, message: "Cập nhật thành công." });
    } catch (error) {
        res.status(500).send({ error: "Lỗi cập nhật." });
    }
};

exports.getDoctorSchedule = async (req, res) => {
    const { id_bacsi, ngay } = req.query;
    try {
        const schedule = await service.getSchedule(id_bacsi, ngay);
        res.status(200).json({ data: schedule });
    } catch (error) {
        res.status(500).send({ error: "Lỗi server." });
    }
};

exports.getDailyStatistics = async (req, res) => {
    const { id_bacsi } = req.query;
    try {
        const today = new Date().toISOString().split('T')[0];
        const stats = await service.getStatistics(id_bacsi, today);
        res.status(200).json({ data: { so_benh_nhan: stats?.so_benh_nhan || 0, da_kham: stats?.da_kham || 0 } });
    } catch (error) {
        res.status(500).send({ error: "Lỗi server." });
    }
};

// =========================================================
// 2. QUẢN LÝ BỆNH NHÂN & HỒ SƠ
// =========================================================

exports.getFullRecordDetail = async (req, res) => {
    const { id_datlich } = req.query;
    try {
        const details = await service.getAllRecordDetails(id_datlich);
        if (!details) return res.status(404).send({ error: "Không tìm thấy dữ liệu." });
        res.status(200).json({ data: details });
    } catch (error) {
        res.status(500).send({ error: "Lỗi server." });
    }
};

exports.getPatientDetail = async (req, res) => {
    const { id_benhnhan } = req.query;
    try {
        const [rows] = await db.query(`SELECT * FROM benhnhan WHERE id_benhnhan = ?`, [id_benhnhan]);
        if (!rows || rows.length === 0) return res.status(404).send({ error: "Không tìm thấy bệnh nhân." });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).send({ error: "Lỗi server." });
    }
};

exports.getDatlichByBenhnhan = async (req, res) => {
    const { id_benhnhan, id_bacsi } = req.query;
    try {
        const datlich = await service.getDatlichByBenhnhanAndBacsi(id_benhnhan, id_bacsi);
        res.status(200).json({ data: datlich });
    } catch (error) {
        res.status(500).send({ error: "Lỗi server." });
    }
};

// =========================================================
// 3. XỬ LÝ LƯU BỆNH ÁN & TOA THUỐC
// =========================================================

exports.saveMedicalRecord = async (req, res) => {
    const data = req.body;
    console.log("👉 [DEBUG] Save Medical Record:", data.id_datlich);

    if (!data.id_datlich || !data.id_bacsi) return res.status(400).send({ error: "Thiếu dữ liệu." });

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Lấy thông tin từ dat_lich_letan (SỬA LỖI 500 TẠI ĐÂY)
        const [lichData] = await connection.query("SELECT * FROM dat_lich_letan WHERE id_datlich = ?", [data.id_datlich]);
        if (lichData.length === 0) throw new Error("Không tìm thấy lịch khám trong dat_lich_letan.");
        
        const lich = lichData[0];
        const id_benhnhan = lich.id_benhnhan; 

        if (!id_benhnhan) throw new Error("Lỗi dữ liệu: Không có ID bệnh nhân.");

        // 2. Cập nhật Bệnh nhân
        await connection.query(
            `UPDATE benhnhan SET gioi_tinh = ?, ngay_sinh = ?, dia_chi = ? WHERE id_benhnhan = ?`,
            [data.gioi_tinh, data.ngay_sinh, data.dia_chi, id_benhnhan]
        );

        // 3. Lưu/Update Hồ sơ khám
        const [existingHoso] = await connection.query("SELECT id_hoso FROM ho_so_kham WHERE id_datlich = ?", [data.id_datlich]);

        if (existingHoso.length > 0) {
            await connection.query(
                `UPDATE ho_so_kham SET trieu_chung=?, chuan_doan=?, ghi_chu=?, id_benhnhan=?, id_bacsi=?, trang_thai='DA_KHAM' WHERE id_datlich=?`,
                [data.trieu_chung, data.chuan_doan, data.ghi_chu, id_benhnhan, data.id_bacsi, data.id_datlich]
            );
        } else {
            await connection.query(
                `INSERT INTO ho_so_kham (id_datlich, id_benhnhan, id_bacsi, trieu_chung, chuan_doan, ghi_chu, trang_thai) VALUES (?, ?, ?, ?, ?, ?, 'DA_KHAM')`,
                [data.id_datlich, id_benhnhan, data.id_bacsi, data.trieu_chung, data.chuan_doan, data.ghi_chu]
            );
        }

        // 4. Update trạng thái
        await connection.query("UPDATE dat_lich_letan SET trang_thai = 'HOAN_THANH' WHERE id_datlich = ?", [data.id_datlich]);

        await connection.commit();
        console.log("✅ Lưu bệnh án thành công cho:", id_benhnhan);
        res.status(200).json({ success: true, message: "Lưu thành công.", id_benhnhan });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Lỗi lưu bệnh án:", error.message);
        res.status(500).send({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.savePrescription = async (req, res) => {
    try {
        await service.savePrescription(req.body);
        res.status(200).json({ success: true, message: "Lưu toa thuốc thành công." });
    } catch (error) {
        console.error("Error savePrescription:", error);
        res.status(500).send({ error: "Lỗi lưu toa thuốc." });
    }
};

// --- API LỊCH SỬ KHÁM (SỬA LỖI 404 CẦN CÁI NÀY + ROUTE) ---
exports.getPatientHistory = async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).send({ error: "Thiếu ID." });

    try {
        const [rows] = await db.query(`
            SELECT h.id_hoso, DATE_FORMAT(h.ngay_tao, '%d/%m/%Y %H:%i') as ngay_kham, 
                   h.chuan_doan, h.trieu_chung, b.ho_ten as ten_bacsi, k.ten_khoa
            FROM ho_so_kham h
            LEFT JOIN bacsi b ON h.id_bacsi = b.id_bacsi
            LEFT JOIN khoa k ON b.id_khoa = k.id_khoa
            WHERE h.id_benhnhan = ?
            ORDER BY h.ngay_tao DESC
        `, [id]);
        res.status(200).json({ data: rows });
    } catch (error) {
        console.error("Error getPatientHistory:", error);
        res.status(500).send({ error: "Lỗi server." });
    }
};
