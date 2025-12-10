const DoctorDHSTModel = require('../models/DoctorDHST.model');

class DoctorDHSTService {
    constructor(pool) {
        this.doctorModel = new DoctorDHSTModel(pool);
        this.pool = pool;
    }

    async getProfile(id_bacsi) { return await this.doctorModel.findDoctorProfile(id_bacsi); }

    async updateProfile(data) {
        if (!data.id_bacsi) throw new Error("Missing doctor ID.");
        const result = await this.doctorModel.updateDoctorProfile(data);
        return result.affectedRows;
    }

    async getSchedule(id_bacsi, ngay) {
        const schedule = await this.doctorModel.findDoctorSchedule(id_bacsi, ngay);
        return schedule.map(row => {
            let ngayStr = row.ngay;
            if (typeof row.ngay === 'object') ngayStr = row.ngay.toISOString().split('T')[0];

            let trangThaiText = row.trang_thai;
            const statusMap = {
                'CHO_XAC_NHAN': 'Chờ xác nhận',
                'DA_TAO_HOSO': 'Đã có hồ sơ',
                'DA_CHECKIN': 'Đang chờ khám',
                'DANG_KHAM': 'Đang khám',
                'HOAN_THANH': 'Đã khám xong',
                'HUY': 'Đã hủy'
            };
            if (statusMap[row.trang_thai]) trangThaiText = statusMap[row.trang_thai];
            
            return {
                id_datlich: row.id_datlich,
                id_benhnhan: row.id_benhnhan || 'N/A',
                ten_benhnhan: row.ten_benhnhan || 'Chưa có tên',
                sdt: row.sdt,
                ngay: ngayStr,
                khung_gio: row.khung_gio || '',
                trang_thai: trangThaiText,
                raw_status: row.trang_thai,
                ly_do: row.ly_do
            };
        });
    }
    
    async getStatistics(id_bacsi, today) { return await this.doctorModel.findDailyStatistics(id_bacsi, today); }

    async getDatlichByBenhnhanAndBacsi(id_benhnhan, id_bacsi) {
        const [rows] = await this.pool.query(
            `SELECT * FROM dat_lich WHERE (id_benhnhan = ? OR sdt = (SELECT phone FROM benhnhan WHERE id_benhnhan = ?))
             AND id_bacsi = ? AND trang_thai != 'HUY' ORDER BY ngay DESC LIMIT 1`,
            [id_benhnhan, id_benhnhan, id_bacsi]
        );
        return rows[0] || {};
    }

    // --- LẤY FULL CHI TIẾT ĐỂ HIỂN THỊ MODAL ---
    async getAllRecordDetails(id_datlich) {
        const appointmentDetails = await this.doctorModel.findAppointmentDetails(id_datlich);
        if (!appointmentDetails) return null;

        const medicalRecord = await this.doctorModel.findMedicalRecord(id_datlich);
        const prescriptionDetails = await this.doctorModel.findPrescriptionDetails(id_datlich);

        return {
            appointment: {
                id_datlich: appointmentDetails.id_datlich,
                ngay_kham: appointmentDetails.ngay_kham,
                khung_gio: appointmentDetails.khung_gio,
                trang_thai: appointmentDetails.trang_thai,
                // Ưu tiên thông tin từ bảng đặt lịch nếu chưa có bệnh nhân
                ten_goc: appointmentDetails.ten_benhnhan,
                sdt_goc: appointmentDetails.sdt
            },
            patient: {
                id: appointmentDetails.id_benhnhan, // Có thể là 'N/A'
                ho_ten: appointmentDetails.ten_benhnhan, 
                gioi_tinh: appointmentDetails.gioi_tinh,
                ngay_sinh: appointmentDetails.ngay_sinh,
                dia_chi: appointmentDetails.dia_chi,
                sdt: appointmentDetails.sdt,
                so_bhyt: appointmentDetails.so_bhyt
            },
            medicalRecord: medicalRecord || {}, 
            prescription: { toa_thuoc: prescriptionDetails } 
        };
    }

    async savePrescription(data) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            // Lấy id_hoso
            const [hoso] = await connection.query(`SELECT id_hoso, id_benhnhan FROM ho_so_kham WHERE id_datlich = ?`, [data.id_datlich]);
            if (hoso.length === 0) throw new Error("Chưa có hồ sơ khám bệnh! Vui lòng lưu bệnh án trước.");
            
            const { id_hoso, id_benhnhan } = hoso[0];

            // Xóa toa cũ
            const [oldToa] = await connection.query(`SELECT id_toa FROM toa_thuoc WHERE id_hoso = ?`, [id_hoso]);
            if(oldToa.length > 0) {
                await connection.query(`DELETE FROM chi_tiet_thuoc WHERE id_toa = ?`, [oldToa[0].id_toa]);
                await connection.query(`DELETE FROM toa_thuoc WHERE id_toa = ?`, [oldToa[0].id_toa]);
            }

            // Tạo toa mới
            const [newToa] = await connection.query(
                `INSERT INTO toa_thuoc (id_hoso, id_benhnhan, id_bacsi, ghi_chu) VALUES (?, ?, ?, ?)`,
                [id_hoso, id_benhnhan, data.id_bacsi, 'Kê đơn online']
            );
            const id_toa = newToa.insertId;

            // Lưu chi tiết
            if (data.toa_thuoc && data.toa_thuoc.length > 0) {
                for (const drug of data.toa_thuoc) {
                    await connection.query(
                        `INSERT INTO chi_tiet_thuoc (id_toa, ten_thuoc, lieu_luong, so_ngay, cach_dung) VALUES (?, ?, ?, ?, ?)`,
                        [id_toa, drug.ten_thuoc, drug.lieu_luong, drug.so_ngay, drug.cach_dung]
                    );
                }
            }
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = DoctorDHSTService;
