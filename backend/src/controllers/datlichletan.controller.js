// ==============================
//  Controller: Đặt lịch lễ tân
// ==============================
const DatLichLeTanService = require("../services/datlichletan.service");
const DatLichLeTanModel = require("../models/datlichletan.model");

const DatLichLeTanController = {
  // 🧾 Lấy toàn bộ lịch hẹn
  async getAll(req, res) {
    try {
      const data = await DatLichLeTanModel.getAll();
      res.json({ success: true, data });
    } catch (err) {
      console.error("❌ Lỗi getAll:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 🧩 Lấy lịch theo trạng thái (VD: CHO_KHAM, DA_DAT, DA_CHECKIN)
  async getByStatus(req, res) {
    try {
      const { status } = req.params;
      const data = await DatLichLeTanModel.getByStatus(status);
      res.json({ success: true, data });
    } catch (err) {
      console.error("❌ Lỗi getByStatus:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 🔍 Lấy chi tiết lịch theo ID
  async getById(req, res) {
    try {
      const { id_datlich } = req.params;
      const data = await DatLichLeTanModel.findById(id_datlich);
      if (!data)
        return res.status(404).json({ success: false, message: "Không tìm thấy lịch" });
      res.json({ success: true, data });
    } catch (err) {
      console.error("❌ Lỗi getById:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 🏥 Tạo lịch mới từ lễ tân
  async create(req, res) {
    try {
      const result = await DatLichLeTanService.create(req.body);
      res.json(result);
    } catch (err) {
      console.error("❌ Lỗi create:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ✅ Check-in bệnh nhân theo số điện thoại
  async checkin(req, res) {
    try {
      const result = await DatLichLeTanService.checkinByPhone(req.body);
      res.json(result);
    } catch (err) {
      console.error("❌ Lỗi checkin:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 👩‍⚕️ Xem trước bác sĩ (round robin)
  async previewDoctor(req, res) {
    try {
      const { id_khoa } = req.query;
      if (!id_khoa)
        return res
          .status(400)
          .json({ success: false, message: "Thiếu id_khoa trong query" });

      const result = await DatLichLeTanService.previewRoundRobinDoctor(id_khoa);
      res.json({ success: true, data: result });
    } catch (err) {
      console.error("❌ Lỗi previewDoctor:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 🗓️ Lấy danh sách bác sĩ có lịch theo ca & ngày
  async getDoctorsBySchedule(req, res) {
    try {
      const { id_khoa, ngay, ca } = req.query;
      if (!id_khoa || !ngay || !ca) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu tham số id_khoa, ngay hoặc ca" });
      }

      const data = await DatLichLeTanService.getDoctorsBySchedule(id_khoa, ngay, ca);
      res.json({ success: true, data });
    } catch (err) {
      console.error("❌ Lỗi getDoctorsBySchedule:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

// ✅ Xuất controller ra ngoài cho routes sử dụng
module.exports = DatLichLeTanController;
