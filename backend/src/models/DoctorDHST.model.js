const db = require('../../config/db');
const DoctorDHSTModel = {
    // Lấy danh sách lịch khám của bác sĩ (có thể lọc theo ngày)
    async findByDoctor(id_bacsi, ngay = null) {
        let sql = `
            SELECT 
                dl.id_datlich,
                dl.id_benhnhan,
                dl.ngay,
                dl.khung_gio,
                dl.trang_thai,
                k.ten_khoa
            FROM dat_lich dl
            JOIN khoa k ON dl.id_khoa = k.id_khoa
            WHERE dl.id_bacsi = ?
        `;
        const params = [id_bacsi];
        if (ngay) {
            sql += " AND dl.ngay = ?";
            params.push(ngay);
        }
        sql += " ORDER BY dl.ngay DESC, dl.khung_gio ASC";
        const [rows] = await db.query(sql, params);
        return rows;
    },

    // Lấy thông tin chi tiết bệnh nhân theo ID
    async findPatientById(id_benhnhan) {
        const sql = `
            SELECT 
                id_benhnhan, ho_ten, ngay_sinh, gioi_tinh, 
                dia_chi, phone AS sdt, trieu_chung
            FROM benhnhan
            WHERE id_benhnhan = ?
        `;
        const [rows] = await db.query(sql, [id_benhnhan]);
        return rows[0] || null;
    }
};

module.exports = DoctorDHSTModel;
