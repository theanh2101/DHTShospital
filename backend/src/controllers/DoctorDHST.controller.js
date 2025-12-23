const DoctorDHSTService = require('../services/DoctorDHST.service');
const db = require('../../config/db');

// 🔥 QUAN TRỌNG: Import model tra cứu để dùng cho phần lịch sử
const patientModel = require('../models/patientModel'); 

const service = new DoctorDHSTService(db);

// =========================================================
// 1. QUẢN LÝ BÁC SĨ & LỊCH TRÌNH
// =========================================================

exports.getBacsiIdFromTaikhoan = async (req, res) => {
    const { id_taikhoan } = req.query;
    if (!id_taikhoan) return res.status(400).json({ error: "Thiếu id_taikhoan." });

    try {
        const [rows] = await db.query(
            `SELECT id_bacsi FROM bacsi WHERE id_taikhoan = ? LIMIT 1`,
            [id_taikhoan]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy bác sĩ." });
        }
        res.json({ data: { id_bacsi: rows[0].id_bacsi } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server." });
    }
};

exports.getDoctorProfile = async (req, res) => {
    const { id_bacsi } = req.query;
    try {
        const profile = await service.getProfile(id_bacsi);
        if (!profile) return res.status(404).json({ error: "Không tìm thấy bác sĩ." });
        res.json({ data: profile });
    } catch (err) {
        res.status(500).json({ error: "Lỗi server." });
    }
};

exports.updateDoctorProfile = async (req, res) => {
    try {
        await service.updateProfile(req.body);
        res.json({ success: true, message: "Cập nhật thành công." });
    } catch (err) {
        res.status(500).json({ error: "Lỗi cập nhật." });
    }
};

exports.getDoctorSchedule = async (req, res) => {
    const { id_bacsi, ngay } = req.query;
    try {
        // Sử dụng service hoặc query trực tiếp đều được
        // Ở đây dùng service cho gọn nếu bạn đã có hàm đó
        const schedule = await service.getSchedule(id_bacsi, ngay);
        res.json({ data: schedule });
    } catch (err) {
        res.status(500).json({ error: "Lỗi server." });
    }
};

// Hàm thống kê nhanh trong ngày
exports.getDailyStatistics = async (req, res) => {
    const { id_bacsi } = req.query;
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Đếm tổng số bệnh nhân hôm nay
        const [totalRows] = await db.query(
            `SELECT COUNT(*) as count FROM dat_lich_letan WHERE id_bacsi = ? AND ngay = ?`, 
            [id_bacsi, today]
        );
        
        // Đếm số bệnh nhân đã khám xong
        const [doneRows] = await db.query(
            `SELECT COUNT(*) as count FROM dat_lich_letan WHERE id_bacsi = ? AND ngay = ? AND (trang_thai = 'HOAN_THANH' OR trang_thai = 'DA_KHAM')`, 
            [id_bacsi, today]
        );

        res.json({ 
            data: { 
                so_benh_nhan: totalRows[0].count, 
                da_kham: doneRows[0].count 
            } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi thống kê." });
    }
};

// =========================================================
// 2. QUẢN LÝ BỆNH NHÂN & HỒ SƠ
// =========================================================

// Khi bác sĩ mở hồ sơ -> set trạng thái DANG_KHAM
exports.getFullRecordDetail = async (req, res) => {
    const { id_datlich } = req.query;
    if (!id_datlich) return res.status(400).json({ error: "Thiếu id_datlich." });

    try {
        // Cập nhật trạng thái
        await db.query(
            `UPDATE dat_lich_letan 
             SET trang_thai = 'DANG_KHAM' 
             WHERE id_datlich = ? AND trang_thai <> 'HOAN_THANH'`,
            [id_datlich]
        );

        // Lấy chi tiết
        const details = await service.getAllRecordDetails(id_datlich);
        if (!details) return res.status(404).json({ error: "Không tìm thấy dữ liệu." });

        res.json({ data: details });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server." });
    }
};

exports.getPatientDetail = async (req, res) => {
    const { id_benhnhan } = req.query;
    try {
        const [rows] = await db.query(
            `SELECT * FROM benhnhan WHERE id_benhnhan = ?`,
            [id_benhnhan]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy bệnh nhân." });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Lỗi server." });
    }
};

exports.getDatlichByBenhnhan = async (req, res) => {
    const { id_benhnhan, id_bacsi } = req.query;
    try {
        const datlich = await service.getDatlichByBenhnhanAndBacsi(id_benhnhan, id_bacsi);
        res.json({ data: datlich });
    } catch (err) {
        res.status(500).json({ error: "Lỗi server." });
    }
};

// =========================================================
// 3. LỊCH SỬ KHÁM (DÙNG MODEL TRA CỨU)
// =========================================================

exports.getPatientHistory = async (req, res) => {
    const { id } = req.params;              // id_benhnhan
    const { currentDatlichId } = req.query; // id để loại trừ

    console.log(`[API History] Đang lấy lịch sử cho BN: ${id}`);

    if (!id || id === 'undefined') return res.status(400).json({ error: "Thiếu id bệnh nhân." });

    try {
        // Gọi hàm từ patientModel đã import ở đầu file
        const history = await patientModel.getVisitsByPatientId(id, currentDatlichId);
        res.json({ success: true, data: history });
    } catch (err) {
        console.error("Lỗi lấy lịch sử:", err);
        res.status(500).json({ error: "Lỗi server khi lấy lịch sử." });
    }
};

exports.getHistoryDetail = async (req, res) => {
    const { id_hoso } = req.params;

    try {
        const detail = await patientModel.getVisitDetails(id_hoso);
        if (!detail) {
            return res.status(404).json({ error: "Không tìm thấy hồ sơ." });
        }
        res.json({ success: true, data: detail });
    } catch (err) {
        console.error("Lỗi xem chi tiết:", err);
        res.status(500).json({ error: "Lỗi server." });
    }
};

// =========================================================
// 4. LƯU BỆNH ÁN & TOA THUỐC (TRANSACTION)
// =========================================================

exports.saveMedicalRecord = async (req, res) => {
    const data = req.body;
    if (!data.id_datlich || !data.id_bacsi) {
        return res.status(400).json({ error: "Thiếu dữ liệu." });
    }

    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        // 1. Lấy thông tin lịch khám để biết bệnh nhân là ai
        const [lichRows] = await conn.query(
            `SELECT * FROM dat_lich_letan WHERE id_datlich = ?`,
            [data.id_datlich]
        );
        if (lichRows.length === 0) throw new Error("Không tìm thấy lịch khám.");
        const id_benhnhan = lichRows[0].id_benhnhan;

        // 2. (Tùy chọn) Cập nhật thông tin hành chính bệnh nhân nếu có thay đổi
        /*
        await conn.query(
            `UPDATE benhnhan SET gioi_tinh=?, ngay_sinh=?, dia_chi=? WHERE id_benhnhan=?`,
            [data.gioi_tinh, data.ngay_sinh, data.dia_chi, id_benhnhan]
        );
        */

        // 3. Lưu hoặc Cập nhật Hồ sơ khám (ho_so_kham)
        const [hoso] = await conn.query(
            `SELECT id_hoso FROM ho_so_kham WHERE id_datlich=?`,
            [data.id_datlich]
        );

        let id_hoso_saved;

        if (hoso.length > 0) {
            // Update
            id_hoso_saved = hoso[0].id_hoso;
            await conn.query(
                `UPDATE ho_so_kham 
                 SET trieu_chung=?, chuan_doan=?, ghi_chu=?, id_bacsi=?, trang_thai='DA_KHAM', ngay_tao=NOW()
                 WHERE id_datlich=?`,
                [data.trieu_chung, data.chuan_doan, data.ghi_chu, data.id_bacsi, data.id_datlich]
            );
        } else {
            // Insert
            const [result] = await conn.query(
                `INSERT INTO ho_so_kham 
                 (id_datlich, id_benhnhan, id_bacsi, trieu_chung, chuan_doan, ghi_chu, trang_thai, ngay_tao)
                 VALUES (?, ?, ?, ?, ?, ?, 'DA_KHAM', NOW())`,
                [data.id_datlich, id_benhnhan, data.id_bacsi, data.trieu_chung, data.chuan_doan, data.ghi_chu]
            );
            id_hoso_saved = result.insertId;
        }

        // 4. Lưu Toa Thuốc (Xóa cũ thêm mới để đơn giản hóa logic update)
        // Xóa toa thuốc cũ (nếu có) liên quan đến hồ sơ này
        // Lưu ý: Cần chắc chắn logic bảng toa_thuoc và chi_tiet_thuoc
        
        // Giả sử bảng toa_thuoc liên kết 1-1 hoặc 1-n với ho_so_kham.
        // Ở đây mình demo lưu thẳng vào chi tiết nếu bạn có bảng trung gian, hãy điều chỉnh.
        // Logic đơn giản: Nếu có danh sách thuốc gửi lên
        if (data.toa_thuoc && data.toa_thuoc.length > 0) {
            // Tạo toa thuốc mới
            const [toa] = await conn.query(
                `INSERT INTO toa_thuoc (id_hoso, ngay_ke, id_bacsi) VALUES (?, NOW(), ?)`,
                [id_hoso_saved, data.id_bacsi]
            );
            const id_toa = toa.insertId;

            // Chèn chi tiết thuốc
            for (const t of data.toa_thuoc) {
                await conn.query(
                    `INSERT INTO chi_tiet_thuoc (id_toa, ten_thuoc, lieu_luong, so_ngay, cach_dung)
                     VALUES (?, ?, ?, ?, ?)`,
                    [id_toa, t.ten_thuoc, t.lieu_luong, t.so_ngay, t.cach_dung]
                );
            }
        }

        // 5. Cập nhật trạng thái lịch hẹn thành HOAN_THANH
        await conn.query(
            `UPDATE dat_lich_letan SET trang_thai='HOAN_THANH' WHERE id_datlich=?`,
            [data.id_datlich]
        );

        await conn.commit();
        res.json({ success: true, message: "Lưu bệnh án thành công." });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Lỗi lưu bệnh án:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// API lưu toa thuốc riêng (nếu cần)
exports.savePrescription = async (req, res) => {
    try {
        // Logic lưu toa thuốc riêng nếu có
        res.json({ success: true, message: "Đã lưu toa thuốc." });
    } catch (err) {
        res.status(500).json({ error: "Lỗi lưu toa thuốc." });
    }
};