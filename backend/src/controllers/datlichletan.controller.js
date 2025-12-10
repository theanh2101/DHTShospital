// backend/src/controllers/datlichletan.controller.js
const DatLichLeTanService = require("../services/datlichletan.service");

const DatLichLeTanController = {
  async getAll(req, res) {
    try {
      const data = await DatLichLeTanService.getAll();
      res.json({ success: true, data });
    } catch (err) {
      console.error("Lỗi getAll datlichletan:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      // luôn yêu cầu id_letan gửi từ client (được lấy từ session / localStorage khi login)
      const body = req.body;
      if (!body.id_letan) return res.status(400).json({ success: false, message: "Thiếu id_letan" });

      const result = await DatLichLeTanService.create(body);
      res.status(201).json({ success: true, message: "Tạo lịch & hồ sơ thành công", data: result });
    } catch (err) {
      console.error("Lỗi tạo datlichletan:", err);
      res.status(500).json({ success: false, message: err.message || "Lỗi server khi tạo lịch" });
    }
  },

  async checkin(req, res) {
    try {
      const { sdt, id_letan } = req.body;
      const result = await DatLichLeTanService.checkinByPhone({ sdt, id_letan });
      if (!result) return res.json({ success: false, message: "Không tìm thấy thông tin" });

      if (result.type === "online") {
        return res.json({
          success: true,
          data: {
            ten_benhnhan: result.data.ten_benhnhan,
            sdt: result.data.sdt,
            email: result.data.email,
            id_khoa: result.data.id_khoa,
            ngay: result.data.ngay,
            khung_gio: result.data.khung_gio,
            id_bacsi: result.data.id_bacsi,
            ly_do: result.data.ly_do,
            source: "online",
          },
        });
      } else {
        // patient record
        const p = result.data;
        return res.json({
          success: true,
          data: {
            ten_benhnhan: p.ho_ten,
            sdt: p.phone,
            email: p.email,
            id_khoa: null,
            ngay: null,
            khung_gio: null,
            id_bacsi: null,
            ly_do: null,
            source: "patient",
          },
        });
      }
    } catch (err) {
      console.error("Lỗi checkin:", err);
      res.status(500).json({ success: false, message: err.message || "Lỗi checkin" });
    }
  },

  // endpoint cho frontend lấy bác sĩ theo schedule
  async getDoctorsBySchedule(req, res) {
    try {
      const { id_khoa, ngay, ca } = req.query;
      if (!id_khoa || !ngay || !ca) return res.status(400).json({ success: false, message: "Thiếu tham số" });

      const data = await DatLichLeTanService.getDoctorsBySchedule(id_khoa, ngay, ca);
      res.json({ success: true, data });
    } catch (err) {
      console.error("Lỗi getDoctorsBySchedule:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = DatLichLeTanController;
