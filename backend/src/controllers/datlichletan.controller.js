const DatLichLeTanService = require("../services/datlichletan.service");

// Hàm helper format ngày chuẩn Local (Fix lỗi bị lùi 1 ngày do lệch múi giờ UTC)
const formatDateLocal = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
      res.status(201).json({ success: true, message: "Tạo hồ sơ & xử lý lịch thành công", data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ✅ CHECK-IN NÂNG CẤP
  async checkin(req, res) {
    try {
      const { sdt } = req.body;
      const { online, patients } = await DatLichLeTanService.checkinByPhone({ sdt });

      if (online.length === 0 && patients.length === 0) {
        return res.json({ success: false, message: "Chưa có dữ liệu nào về SĐT này.", count: 0 });
      }

      const getCa = (h) => (h && parseInt(h.split(':')[0]) < 12) ? "Sang" : "Chieu";
      const results = [];

      // 1. Lịch Online
      online.forEach(o => {
        results.push({
            type: 'ONLINE',
            id: o.id_datlich,
            ho_ten: o.ten_benhnhan,
            sdt: o.sdt,
            mo_ta: `Đặt lịch Online: ${o.ten_khoa || 'Chưa chọn khoa'} - ${formatDateLocal(o.ngay)} (${o.khung_gio})`,
            // Dữ liệu thô để điền form
            raw_data: {
                id_datlich_online: o.id_datlich, // [QUAN TRỌNG] ID để xóa sau khi tạo xong
                ho_ten: o.ten_benhnhan,
                sdt: o.sdt,
                email: o.email,
                id_khoa: o.id_khoa,
                ngay: formatDateLocal(o.ngay), // Đã fix ngày
                ca_kham: getCa(o.khung_gio),
                id_bacsi: o.id_bacsi,
                ly_do: o.ly_do
            }
        });
      });

      // 2. Bệnh nhân cũ
      patients.forEach(p => {
        results.push({
            type: 'PATIENT',
            id: p.id_benhnhan,
            ho_ten: p.ho_ten,
            sdt: p.phone,
            mo_ta: `Bệnh nhân cũ (NS: ${formatDateLocal(p.ngay_sinh)}) - ${p.dia_chi || 'Chưa có địa chỉ'}`,
            raw_data: {
                id_datlich_online: null,
                ho_ten: p.ho_ten,
                sdt: p.phone,
                email: p.email,
                gioi_tinh: p.gioi_tinh,
                ngay_sinh: formatDateLocal(p.ngay_sinh), // Đã fix ngày
                dia_chi: p.dia_chi
            }
        });
      });

      return res.json({
        success: true,
        count: results.length,
        data: results
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