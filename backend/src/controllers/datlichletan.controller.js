// backend/src/controllers/datlichletan.controller.js
const DatLichLeTanService = require("../services/datlichletan.service");

const DatLichLeTanController = {
  async getAll(req, res) {
    try {
      const data = await DatLichLeTanService.getAll();
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      if (!req.body.id_letan) return res.status(400).json({ success: false, message: "Thiếu id_letan" });
      const result = await DatLichLeTanService.create(req.body);
      res.status(201).json({ success: true, message: "Tạo lịch thành công", data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ✅ CHECK-IN NÂNG CẤP: Xử lý nhiều kết quả
  async checkin(req, res) {
    try {
      const { sdt } = req.body;
      const { online, patients } = await DatLichLeTanService.checkinByPhone({ sdt });

      if (online.length === 0 && patients.length === 0) {
        return res.json({ success: false, message: "Chưa có dữ liệu nào về SĐT này.", count: 0 });
      }

      // Helper format
      const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : "";
      const getCa = (h) => (h && parseInt(h.split(':')[0]) < 12) ? "Sang" : "Chieu";

      const results = [];

      // 1. Thêm các lịch Online vào danh sách kết quả
      online.forEach(o => {
        results.push({
            type: 'ONLINE',
            id: o.id_datlich,
            ho_ten: o.ten_benhnhan,
            sdt: o.sdt,
            mo_ta: `Đặt lịch Online: ${o.ten_khoa} - ${formatDate(o.ngay)} (${o.khung_gio})`,
            // Dữ liệu thô để điền form
            raw_data: {
                ho_ten: o.ten_benhnhan, sdt: o.sdt, email: o.email,
                id_khoa: o.id_khoa, ngay: formatDate(o.ngay), ca_kham: getCa(o.khung_gio),
                id_bacsi: o.id_bacsi, ly_do: o.ly_do
            }
        });
      });

      // 2. Thêm các bệnh nhân cũ vào danh sách
      patients.forEach(p => {
        results.push({
            type: 'PATIENT',
            id: p.id_benhnhan,
            ho_ten: p.ho_ten,
            sdt: p.phone,
            mo_ta: `Bệnh nhân cũ (NS: ${formatDate(p.ngay_sinh)}) - ${p.dia_chi || 'Chưa có địa chỉ'}`,
            raw_data: {
                ho_ten: p.ho_ten, sdt: p.phone, email: p.email,
                gioi_tinh: p.gioi_tinh, ngay_sinh: formatDate(p.ngay_sinh),
                dia_chi: p.dia_chi
            }
        });
      });

      return res.json({
        success: true,
        count: results.length,
        data: results // Trả về mảng danh sách để frontend hiển thị Modal
      });

    } catch (err) {
      console.error("Lỗi checkin:", err);
      res.status(500).json({ success: false, message: "Lỗi server checkin" });
    }
  },

  async getDoctorsBySchedule(req, res) {
    try {
        const { id_khoa, ngay, ca } = req.query;
        if (!id_khoa || !ngay || !ca) return res.status(400).json({ success: false });
        const data = await DatLichLeTanService.getDoctorsBySchedule(id_khoa, ngay, ca);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = DatLichLeTanController;