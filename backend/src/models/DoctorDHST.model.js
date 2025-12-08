const db = require('../../config/db');

class DoctorDHSTModel {
    constructor(pool) {
        this.pool = pool;
    }

    // Helper: Lấy connection (để hỗ trợ transaction từ Service truyền vào nếu cần)
    getConn(connection) {
        return connection || this.pool;
    }

    // =========================================================
    // 1. THÔNG TIN BÁC SĨ (PROFILE)
    // =========================================================
    async findDoctorProfile(id_bacsi) {
        const [rows] = await this.pool.query(
            `SELECT 
                b.id_bacsi, b.ho_ten, b.hoc_vi, b.chuyen_mon, b.hinh_anh,
                b.nam_kinh_nghiem, b.email, b.phone, k.ten_khoa
             FROM bacsi b 
             LEFT JOIN khoa k ON b.id_khoa = k.id_khoa
             WHERE b.id_bacsi = ?`,
            [id_bacsi]
        );
        return rows[0];
    }

    async updateDoctorProfile(data) {
        const { id_bacsi, ho_ten, hoc_vi, chuyen_mon, nam_kinh_nghiem, email, phone } = data;
        
        const [result] = await this.pool.query(
            `UPDATE bacsi SET ho_ten=?, hoc_vi=?, chuyen_mon=?, nam_kinh_nghiem=?, email=?, phone=? WHERE id_bacsi=?`,
            [
                ho_ten, hoc_vi, chuyen_mon, 
                nam_kinh_nghiem !== undefined ? parseInt(nam_kinh_nghiem) : null, 
                email, phone, 
                id_bacsi
            ]
        );
        return result;
    }

    // =========================================================
    // 2. LỊCH LÀM VIỆC & DANH SÁCH BỆNH NHÂN
    // =========================================================
    async findDoctorSchedule(id_bacsi, ngay) {
        let sql = `
            SELECT 
                dl.id_datlich, 
                DATE_FORMAT(dl.ngay, '%Y-%m-%d') as ngay, 
                dl.khung_gio, 
                dl.trang_thai, 
                dl.ly_do,
                
                -- Logic quan trọng: Lấy ID bệnh nhân nếu có, hoặc trả về null/N/A
                COALESCE(dl.id_benhnhan, bn.id_benhnhan) as id_benhnhan,
                
                -- Tên hiển thị: Ưu tiên lấy từ hồ sơ bệnh nhân, nếu không có (khách mới) thì lấy tên lúc đặt lịch
                COALESCE(bn.ho_ten, dl.ten_benhnhan) as ten_benhnhan,
                COALESCE(bn.phone, dl.sdt) as sdt

            FROM dat_lich dl
            -- Join mềm: Thử tìm bệnh nhân theo ID hoặc theo SĐT
            LEFT JOIN benhnhan bn ON (dl.id_benhnhan = bn.id_benhnhan OR dl.sdt = bn.phone)
            WHERE dl.id_bacsi = ? 
        `;
        
        const params = [id_bacsi];
        
        if (ngay) {
            dateCondition = 'AND dl.ngay = ?';
            params.push(ngay);
        }

        const [rows] = await this.pool.query(
            `SELECT
                dl.id_datlich, 
                dl.ngay as ngay, 
                TIME_FORMAT(dl.gio_dat, '%H:%i') as khung_gio, 
                bn.ho_ten as ten_benhnhan, 
                dl.trang_thai, 
                bn.id_benhnhan
             FROM dat_lich dl
             LEFT JOIN benhnhan bn ON dl.id_benhnhan = bn.id_benhnhan
             WHERE dl.id_bacsi = ? ${dateCondition}
             ORDER BY dl.ngay, dl.gio_dat`,
            params
        );
        return rows;
    }

    async findDailyStatistics(id_bacsi, today) {
        const [rows] = await this.pool.query(
            `SELECT 
                COUNT(id_datlich) AS so_benh_nhan,
                SUM(CASE WHEN trang_thai = 'Da xac nhan' THEN 1 ELSE 0 END) AS da_kham
             FROM datlich
             WHERE id_bacsi = ? AND ngay = ?`,
            [id_bacsi, today]
        );
        return rows[0];
    }

    // Lấy id_datlich từ id_benhnhan và id_bacsi (lấy lịch hẹn gần nhất)
    async findDatlichByBenhnhanAndBacsi(id_benhnhan, id_bacsi) {
        const [rows] = await this.pool.query(
            `SELECT id_datlich, ngay, gio_dat, trang_thai
             FROM datlich
             WHERE id_benhnhan = ? AND id_bacsi = ?
             ORDER BY ngay DESC, gio_dat DESC
             LIMIT 1`,
            [id_benhnhan, id_bacsi]
        );
        return rows[0] || null;
    }

    // --- Medical Record & Prescription Queries ---
    async findAppointmentDetails(id_datlich) {
        // Hàm này lấy thông tin gộp từ dat_lich và benhnhan
        // Giúp hiển thị đúng thông tin dù là khách mới hay cũ
        const [rows] = await this.pool.query(
            `SELECT
                dl.id_datlich, 
                DATE_FORMAT(dl.ngay, '%Y-%m-%d') as ngay_kham, 
                TIME_FORMAT(dl.gio_dat, '%H:%i') as khung_gio,
                bn.id_benhnhan, 
                bn.ho_ten, 
                bn.ho_ten AS ten_dat_lich,
                bn.gioi_tinh, 
                DATE_FORMAT(bn.ngay_sinh, '%Y-%m-%d') as ngay_sinh, 
                bn.dia_chi,
                NULL as sdt
             FROM datlich dl
             LEFT JOIN benhnhan bn ON dl.id_benhnhan = bn.id_benhnhan
             WHERE dl.id_datlich = ?`,
            [id_datlich]
        );
        return rows[0];
    }

    async findMedicalRecord(id_datlich) {
        const [rows] = await this.pool.query(
            `SELECT id_hoso, trieu_chung, chuan_doan, ghi_chu, trang_thai 
             FROM ho_so_kham 
             WHERE id_datlich = ?`,
            [id_datlich]
        );
        return rows[0] || null;
    }

    async findPrescriptionDetails(id_datlich) {
        // Tìm toa thuốc thông qua id_datlich -> id_hoso -> toa_thuoc
        // Trả về danh sách chi tiết thuốc
        const [rows] = await this.pool.query(
            `SELECT ctt.ten_thuoc, ctt.lieu_luong, ctt.so_ngay, ctt.cach_dung 
             FROM ho_so_kham hsk
             JOIN toa_thuoc tt ON hsk.id_hoso = tt.id_hoso
             JOIN chi_tiet_thuoc ctt ON tt.id_toa = ctt.id_toa
             WHERE hsk.id_datlich = ?`,
            [id_datlich]
        );
        return rows; 
    }

    // =========================================================
    // 4. HỖ TRỢ TRANSACTION (Lưu toa thuốc)
    // =========================================================
    async savePrescription(connection, data) {
        // Hàm này giữ lại để tương thích nếu Service gọi trực tiếp model
        // Tuy nhiên logic chính đã được chuyển sang Service để xử lý transaction gọn hơn
        return true; 
    }
}

module.exports = DoctorDHSTModel;
