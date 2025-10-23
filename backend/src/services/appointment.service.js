const db = require('../../config/db');
const Bacsi = require('../models/bacsi.model');
const DatLich = require('../models/datlich.model');
const Khoa = require('../models/khoa.model'); 
const { sendBookingConfirmationEmail } = require('./email.service');

const MAX_APPOINTMENTS_PER_KHOA = 9;

const getCaFromKhungGio = (khung_gio) => {
    const hour = parseInt(khung_gio.split(':')[0]);
    if (hour < 12) return 'Sang';
    return 'Chieu';
};

const createNewAppointment = async (formData) => {
    const connection = await db.getConnection(); 
    try {
        await connection.beginTransaction();

        const { ten_benhnhan, sdt, email, ngay, khung_gio, id_khoa, ly_do } = formData;

        // Lấy tên khoa
        const khoa = await Khoa.findById(id_khoa, connection);
        if (!khoa) {
            throw new Error('Mã khoa không hợp lệ.');
        }
        const ten_khoa = khoa.ten_khoa;
        
        const khoaAppointmentCount = await DatLich.countInSlot(ngay, khung_gio, id_khoa, connection);
        if (khoaAppointmentCount >= MAX_APPOINTMENTS_PER_KHOA) {
            throw new Error('Khung giờ tại khoa bạn chọn đã đầy.');
        }

        const caLamViec = getCaFromKhungGio(khung_gio);
        if (!caLamViec) throw new Error("Khung giờ không hợp lệ.");
        
        // 1. Lấy danh sách bác sĩ gốc (chưa sắp xếp)
        const onDutyDoctors = await Bacsi.getOnDutyDoctors(id_khoa, ngay, caLamViec, connection);
        if (onDutyDoctors.length === 0) {
            throw new Error(`Khoa này không có bác sĩ làm việc vào ca bạn chọn.`);
        }
        
        // 2. Lấy lượt cuối và tính toán vị trí bắt đầu, sau đó sắp xếp lại danh sách
        const shiftKey = `${id_khoa}-${ngay}-${caLamViec}`;
        const lastIndex = Bacsi.getLastAssignedIndex(shiftKey);
        const startIndex = (lastIndex + 1) % onDutyDoctors.length;
        const rankedDoctors = [...onDutyDoctors.slice(startIndex), ...onDutyDoctors.slice(0, startIndex)];

        // 3. Lặp qua danh sách đã ưu tiên để tìm người còn slot
        const limitPerDoctor = Math.ceil(MAX_APPOINTMENTS_PER_KHOA / onDutyDoctors.length);
        let assignedDoctor = null;

        for (const doctor of rankedDoctors) {
            const count = await DatLich.countAppointmentsForDoctorInSlot(ngay, khung_gio, doctor.id_bacsi, connection);
            if (count < limitPerDoctor) {
                assignedDoctor = doctor; 
                break; 
            }
        }
        
        if (!assignedDoctor) {
            throw new Error('Tất cả bác sĩ đều đã đủ lượt hẹn.');
        }

        // 4. Tạo lịch hẹn
        const newAppointmentData = { ten_benhnhan, sdt, email, ngay, khung_gio, id_khoa, ly_do, id_bacsi: assignedDoctor.id_bacsi, trang_thai: 'CHO_XAC_NHAN', };
        const newAppointment = await DatLich.create(newAppointmentData, connection);
        
        // 5. Cập nhật lại lượt cho lần sau
        const finalIndex = onDutyDoctors.findIndex(doc => doc.id_bacsi === assignedDoctor.id_bacsi);
        Bacsi.updateLastAssignedIndex(shiftKey, finalIndex);

        await connection.commit();
        // ✅ SỬA: Đã thêm 'ten_khoa' vào result
        const result = { appointment: newAppointment, doctor: assignedDoctor, ten_khoa: ten_khoa };
        sendBookingConfirmationEmail(result);
        return result; 

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = { createNewAppointment };