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
                dl.gio_hen as khung_gio, 
                dl.trang_thai, 
                dl.ly_do,
                
                bn.id_benhnhan,
                bn.ho_ten as ten_benhnhan,
                bn.phone as sdt

            FROM dat_lich_letan dl 
            
            LEFT JOIN benhnhan bn ON dl.id_benhnhan = bn.id_benhnhan
            WHERE dl.id_bacsi = ? 
        `;
        
        const params = [id_bacsi];
        
        if (ngay) {
            sql += ' AND dl.ngay = ?';
            params.push(ngay);
        }

        sql += ' ORDER BY dl.ngay ASC, dl.gio_hen ASC';

        const [rows] = await this.pool.query(sql, params);
        return rows;
    }

    async findDailyStatistics(id_bacsi, today) {
        // Cần sửa: nếu lịch khám của BS chỉ có trong dat_lich_letan
        const [rows] = await this.pool.query(
            `SELECT 
                COUNT(id_datlich) AS so_benh_nhan,
                SUM(CASE WHEN trang_thai = 'HOAN_THANH' THEN 1 ELSE 0 END) AS da_kham
             FROM dat_lich_letan -- 👈 Nên chuyển thành dat_lich_letan nếu đó là nguồn chính
             WHERE id_bacsi = ? AND ngay = ?`,
            [id_bacsi, today]
        );
        return rows[0];
    }

    // =========================================================
    // 3. CHI TIẾT CUỘC HẸN & BỆNH ÁN (Full Detail cho Modal)
    // =========================================================
    async findAppointmentDetails(id_datlich) {
        // HÀM NÀY ĐÃ ĐƯỢC SỬA ĐỂ TRUY VẤN TỪ dat_lich_letan
        const [rows] = await this.pool.query(
            `SELECT
                dl.id_datlich, 
                DATE_FORMAT(dl.ngay, '%Y-%m-%d') as ngay_kham, 
                dl.gio_hen as khung_gio, -- 👈 ĐÃ SỬA: Lấy gio_hen và đổi tên thành khung_gio
                dl.ca_kham,              -- Thêm ca_kham
                dl.trang_thai,
                dl.ly_do,
                
                -- Thông tin chuẩn hóa từ bảng Bệnh nhân (benhnhan)
                bn.id_benhnhan,
                bn.ho_ten as ten_benhnhan,
                bn.phone as sdt,
                COALESCE(bn.email, '') as email,
                COALESCE(bn.gioi_tinh, 'Nam') as gioi_tinh,
                DATE_FORMAT(bn.ngay_sinh, '%Y-%m-%d') as ngay_sinh,
                COALESCE(bn.dia_chi, '') as dia_chi,
                bn.so_bhyt
             FROM dat_lich_letan dl  -- 👈 ĐIỀU CHỈNH: FROM dat_lich_letan
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
        // HÀM NÀY CẦN CHẮC CHẮN TỒN TẠI VÀ ĐƯỢC GỌI ĐÚNG
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
        return true; 
    }
}

module.exports = DoctorDHSTModel;
