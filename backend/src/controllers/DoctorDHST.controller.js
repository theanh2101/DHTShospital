// controllers/DoctorDHST.controller.js
const DoctorDHSTService = require('../services/DoctorDHST.service');
const db = require('../../config/db');

// Tạo Service instance một lần với pool từ config
const service = new DoctorDHSTService(db);

// Hàm hỗ trợ sinh ID bệnh nhân tự động (Ví dụ: BN + timestamp)
const generateId = () => 'BN' + Date.now().toString().slice(-6);

// =========================================================
// 1. QUẢN LÝ BÁC SĨ & LỊCH TRÌNH
// =========================================================

// --- GET ID_BACSI FROM ID_TAIKHOAN ---
exports.getBacsiIdFromTaikhoan = async (req, res) => {
    const { id_taikhoan } = req.query;
    if (!id_taikhoan) return res.status(400).send({ error: "Missing id_taikhoan." });

    try {
        const [rows] = await db.query(
            `SELECT id_bacsi FROM bacsi WHERE id_taikhoan = ? LIMIT 1`,
            [id_taikhoan]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).send({ error: "Doctor not found for this account." });
        }

        res.status(200).json({ data: { id_bacsi: rows[0].id_bacsi } });
    } catch (error) {
        console.error("Error in getBacsiIdFromTaikhoan:", error);
        res.status(500).send({ error: "Internal server error." });
    }
};

// --- GET PROFILE ---
exports.getDoctorProfile = async (req, res) => {
    const { id_bacsi } = req?.query;
    if (!id_bacsi) return res.status(400).send({ error: "Missing doctor ID." });

    try {
        const profile = await service.getProfile(id_bacsi);
        if (!profile) return res.status(404).send({ error: "Doctor not found." });
        res.status(200).json({ data: profile });
    } catch (error) {
        console.error("Error in getDoctorProfile:", error);
        res.status(500).send({ error: "Internal server error." });
    }
};

// --- UPDATE PROFILE ---
exports.updateDoctorProfile = async (req, res) => {
    const data = req.body;
    if (!data.id_bacsi) return res.status(400).send({ error: "Missing doctor ID." });

    try {
        await service.updateProfile(data);
        res.status(200).json({ data: { success: true }, message: "Profile updated successfully." });
    } catch (error) {
        console.error("Error in updateDoctorProfile:", error);
        res.status(500).send({ error: error.message || "Failed to update profile." });
    }
};

// --- GET SCHEDULE ---
exports.getDoctorSchedule = async (req, res) => {
    const { id_bacsi, ngay } = req.query;
    if (!id_bacsi) return res.status(400).send({ error: "Missing doctor ID." });

    try {
        const schedule = await service.getSchedule(id_bacsi, ngay);
        res.status(200).json({ data: schedule });
    } catch (error) {
        console.error("Error in getDoctorSchedule:", error);
        res.status(500).send({ error: "Internal server error." });
    }
};

// --- GET STATISTICS ---
exports.getDailyStatistics = async (req, res) => {
    const { id_bacsi } = req.query;
    if (!id_bacsi) return res.status(400).send({ error: "Missing doctor ID." });

    try {
        const today = new Date().toISOString().split('T')[0];
        const stats = await service.getStatistics(id_bacsi, today);

        res.status(200).json({ data: { 
            so_benh_nhan: stats.so_benh_nhan || 0,
            da_kham: stats.da_kham || 0 
        } });
    } catch (error) {
        console.error("Error in getDailyStatistics:", error);
        res.status(500).send({ error: "Internal server error." });
    }
};

// =========================================================
// 2. QUẢN LÝ BỆNH NHÂN & HỒ SƠ BỆNH ÁN
// =========================================================

// --- GET FULL RECORD DETAIL (Cho Modal) ---
exports.getFullRecordDetail = async (req, res) => {
    const { id_datlich } = req.query; 
    if (!id_datlich) return res.status(400).send({ error: "Missing datlich ID." });

    try {
        const details = await service.getAllRecordDetails(id_datlich);
        if (!details) return res.status(404).send({ error: "Appointment not found." });
        res.status(200).json({ data: details });
    } catch (error) {
        console.error("Error fetching full record detail:", error);
        res.status(500).send({ error: "Internal server error." });
    }
};

// --- GET DATLICH BY BENHNHAN (Hỗ trợ tìm ngược) ---
exports.getDatlichByBenhnhan = async (req, res) => {
    const { id_benhnhan, id_bacsi } = req.query;
    if (!id_benhnhan || !id_bacsi) return res.status(400).send({ error: "Missing id_benhnhan or id_bacsi." });

    try {
        const datlich = await service.getDatlichByBenhnhanAndBacsi(id_benhnhan, id_bacsi);
        res.status(200).json({ data: datlich });
    } catch (error) {
        console.error("Error in getDatlichByBenhnhan:", error);
        res.status(500).send({ error: "Internal server error." });
    }
};

// --- GET PATIENT DETAIL ---
exports.getPatientDetail = async (req, res) => {
    const { id_benhnhan } = req.query;
    if (!id_benhnhan) return res.status(400).send({ error: "Missing id_benhnhan." });

    try {
        const [rows] = await db.query(`SELECT * FROM benhnhan WHERE id_benhnhan = ?`, [id_benhnhan]);
        if (!rows || rows.length === 0) return res.status(404).send({ error: "Patient not found." });
        res.status(200).json(rows[0]); 
    } catch (error) {
        console.error("Error in getPatientDetail:", error);
        res.status(500).send({ error: "Internal server error." });
    }
};

// --- SAVE MEDICAL RECORD (FIXED FK ERROR) ---
exports.saveMedicalRecord = async (req, res) => {
    const data = req.body;
    
    // Validate dữ liệu cơ bản
    if (!data.id_datlich || !data.id_bacsi) {
        return res.status(400).send({ error: "Missing required fields (id_datlich, id_bacsi)." });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Lấy thông tin từ bảng dat_lich để có tên và sđt (phòng khi tạo mới)
        const [lichData] = await connection.query("SELECT * FROM dat_lich WHERE id_datlich = ?", [data.id_datlich]);
        if (lichData.length === 0) {
            throw new Error("Không tìm thấy lịch đặt.");
        }
        const lich = lichData[0];

        // 2. Xử lý ID Bệnh nhân (Tạo mới hoặc Lấy cũ)
        let final_id_benhnhan = data.id_benhnhan; 

        // Nếu chưa có ID (khách mới) hoặc ID là placeholder 'N/A'
        if (!final_id_benhnhan || final_id_benhnhan === 'N/A') {
            // Kiểm tra xem SĐT này đã có trong hệ thống chưa để tránh trùng lặp
            const [existingPatient] = await connection.query("SELECT id_benhnhan FROM benhnhan WHERE phone = ?", [lich.sdt]);
            
            if (existingPatient.length > 0) {
                // Đã tồn tại -> Dùng ID cũ
                final_id_benhnhan = existingPatient[0].id_benhnhan;
            } else {
                // Chưa tồn tại -> Tạo bệnh nhân mới hoàn toàn
                final_id_benhnhan = generateId(); 
                
                await connection.query(
                    `INSERT INTO benhnhan (id_benhnhan, ho_ten, phone, email, gioi_tinh, ngay_sinh, dia_chi) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        final_id_benhnhan,
                        lich.ten_benhnhan, // Lấy tên từ lịch đặt
                        lich.sdt,          // Lấy sdt từ lịch đặt
                        lich.email || '',
                        data.gioi_tinh || 'Khac',
                        data.ngay_sinh || null,   // Quan trọng: Đảm bảo DB cho phép NULL nếu ko nhập
                        data.dia_chi || ''
                    ]
                );
            }
        } else {
            // Nếu đã có ID, cập nhật thông tin mới nhất (giới tính, địa chỉ...) vào bảng bệnh nhân
            await connection.query(
                `UPDATE benhnhan SET gioi_tinh = ?, ngay_sinh = ?, dia_chi = ? WHERE id_benhnhan = ?`,
                [data.gioi_tinh, data.ngay_sinh, data.dia_chi, final_id_benhnhan]
            );
        }

        // 3. LƯU HỒ SƠ KHÁM (QUAN TRỌNG: UPDATE nếu có, INSERT nếu chưa)
        // Kiểm tra xem hồ sơ cho lịch này đã tồn tại chưa
        const [existingHoso] = await connection.query(
            "SELECT id_hoso FROM ho_so_kham WHERE id_datlich = ?", 
            [data.id_datlich]
        );

        if (existingHoso.length > 0) {
            // [UPDATE] Nếu hồ sơ đã tồn tại -> Chỉ cập nhật nội dung
            // Giữ nguyên id_hoso để KHÔNG làm lỗi khóa ngoại với bảng toa_thuoc
            await connection.query(
                `UPDATE ho_so_kham 
                 SET trieu_chung = ?, chuan_doan = ?, ghi_chu = ?, id_benhnhan = ?, id_bacsi = ?, trang_thai = 'DA_KHAM'
                 WHERE id_datlich = ?`,
                [data.trieu_chung, data.chuan_doan, data.ghi_chu, final_id_benhnhan, data.id_bacsi, data.id_datlich]
            );
        } else {
            // [INSERT] Nếu chưa có hồ sơ -> Thêm mới
            await connection.query(
                `INSERT INTO ho_so_kham (id_datlich, id_benhnhan, id_bacsi, trieu_chung, chuan_doan, ghi_chu, trang_thai)
                 VALUES (?, ?, ?, ?, ?, ?, 'DA_KHAM')`,
                [data.id_datlich, final_id_benhnhan, data.id_bacsi, data.trieu_chung, data.chuan_doan, data.ghi_chu]
            );
        }

        // 4. Cập nhật trạng thái lịch đặt -> HOAN_THANH và gán ID bệnh nhân chuẩn
        await connection.query(
            "UPDATE dat_lich SET trang_thai = 'HOAN_THANH', id_benhnhan = ? WHERE id_datlich = ?",
            [final_id_benhnhan, data.id_datlich]
        );

        await connection.commit();
        
        res.status(200).json({ 
            success: true, 
            message: "Medical record saved successfully.",
            id_benhnhan: final_id_benhnhan 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error saving medical record:", error);
        res.status(500).send({ error: error.message || "Failed to save medical record." });
    } finally {
        if (connection) connection.release();
    }
};

// --- SAVE PRESCRIPTION ---
exports.savePrescription = async (req, res) => {
    const data = req.body;
    if (!data.id_datlich || !data.id_bacsi || !data.toa_thuoc) return res.status(400).send({ error: "Missing required fields." });

    try {
        await service.savePrescription(data);
        res.status(200).json({ data: { success: true }, message: "Prescription saved successfully." });
    } catch (error) {
        console.error("Error saving prescription:", error);
        res.status(500).send({ error: "Failed to save prescription." });
    }
};
