// controllers/datlich.controller.js
const BenhNhanModel = require('../models/benhnhan.model');
const BacsiModel = require('../models/bacsi.model');
const DatLichModel = require('../models/datlich.model');

const createDatLich = async (req, res) => {
  try {
    const { ho_ten, phone, email, id_khoa, ngay_dat, gio_dat } = req.body;

    // 1️⃣ Kiểm tra đầu vào
    if (!ho_ten || !phone || !id_khoa || !ngay_dat || !gio_dat) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin bắt buộc." });
    }

    // 2️⃣ Tìm hoặc tạo bệnh nhân mới
    const patient = await BenhNhanModel.findOrCreate({ ho_ten, phone, email });
    if (!patient || !patient.id_benhnhan) {
      throw new Error("Không thể tạo hoặc lấy thông tin bệnh nhân.");
    }

    // 3️⃣ Phân công bác sĩ trong khoa
    const assignedDoctor = await BacsiModel.assignDoctorByKhoa(id_khoa);
    if (!assignedDoctor) {
      throw new Error("Không tìm thấy bác sĩ trong khoa này.");
    }

    // 4️⃣ Kiểm tra khung giờ trống
    const slotFull = await DatLichModel.isSlotFullForDoctor(ngay_dat, gio_dat, assignedDoctor.id_bacsi);
    if (slotFull) {
      return res.status(409).json({ success: false, message: "Bác sĩ trong khoa đã có lịch vào giờ này. Vui lòng chọn thời gian khác." });
    }

    // 5️⃣ Tạo lịch đặt
    const newBookingId = await DatLichModel.create({
      id_benhnhan: patient.id_benhnhan,
      id_khoa,
      id_bacsi: assignedDoctor.id_bacsi,
      ngay_dat,
      gio_dat
    });

    // 6️⃣ Lấy thông tin chi tiết lịch vừa tạo
    const bookingDetails = await DatLichModel.findById(newBookingId);
    if (!bookingDetails) {
      throw new Error("Không tìm thấy lịch hẹn sau khi tạo.");
    }

    // 7️⃣ Trả về phản hồi cho frontend
    res.status(201).json({
      success: true,
      message: "Đặt lịch thành công!",
      data: bookingDetails
    });

  } catch (error) {
    console.error("Lỗi khi tạo lịch:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Đã có lỗi xảy ra trên máy chủ."
    });
  }
};

module.exports = { createDatLich };
