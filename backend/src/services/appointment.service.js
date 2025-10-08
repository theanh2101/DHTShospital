// services/appointment.service.js
const db = require('../../config/db');
const Benhnhan = require('../models/benhnhan.model');
const Bacsi = require('../models/bacsi.model');
const DatLich = require('../models/datlich.model');

const MAX_PATIENTS_PER_SLOT = 10;

const createNewAppointment = async (patientData, appointmentData) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1️⃣ Tìm hoặc tạo bệnh nhân
    let patient = await Benhnhan.findByPhone(patientData.phone, connection);
    if (!patient) {
      patient = await Benhnhan.create(patientData, connection);
    }

    // 2️⃣ Kiểm tra số lượng lịch hẹn trong cùng khung giờ
    const count = await DatLich.countInSlot(
      appointmentData.ngay_dat,
      appointmentData.gio_dat,
      appointmentData.id_khoa,
      connection
    );

    if (count >= MAX_PATIENTS_PER_SLOT) {
      throw new Error('Khung giờ tại khoa bạn chọn đã đầy. Vui lòng chọn thời gian khác.');
    }

    // 3️⃣ Tìm bác sĩ rảnh trong khoa
    const assignedDoctor = await Bacsi.findAvailableByKhoa(appointmentData.id_khoa, connection);
    if (!assignedDoctor) {
      throw new Error('Hiện tại không có bác sĩ nào thuộc khoa này.');
    }

    // 4️⃣ Tạo lịch hẹn
    const newAppointmentId = await DatLich.create({
      id_benhnhan: patient.id_benhnhan,
      id_khoa: appointmentData.id_khoa,
      id_bacsi: assignedDoctor.id_bacsi,
      ngay_dat: appointmentData.ngay_dat,
      gio_dat: appointmentData.gio_dat,
    }, connection);

    const newAppointment = await DatLich.findById(newAppointmentId, connection);

    await connection.commit();

    return {
      success: true,
      message: "Đặt lịch thành công!",
      appointment: newAppointment,
      doctor: assignedDoctor,
      patient: patient,
    };
  } catch (error) {
    await connection.rollback();
    console.error("❌ Lỗi khi tạo lịch hẹn:", error);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { createNewAppointment };
