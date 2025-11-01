const db = require("../../config/db");

// ====================== 📅 LẤY LỊCH KHÁM CỦA BÁC SĨ ======================
const getDoctorDHST = async (req, res) => {
  try {
    const { id_bacsi, ngay } = req.query;
    console.log("📩 Nhận request DoctorDHST:", { id_bacsi, ngay });

    if (!id_bacsi?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID bác sĩ (id_bacsi).",
      });
    }

    // 🔍 Truy vấn lịch khám (dat_lich) theo bác sĩ và ngày nếu có
    let query = `
      SELECT 
        dl.id_datlich, dl.ten_benhnhan, dl.sdt, dl.email, dl.ngay, dl.khung_gio,
        dl.ly_do, dl.trang_thai, dl.createdAt,
        b.ho_ten AS ten_bacsi, k.ten_khoa
      FROM dat_lich dl
      LEFT JOIN bacsi b ON dl.id_bacsi = b.id_bacsi
      LEFT JOIN khoa k ON dl.id_khoa = k.id_khoa
      WHERE dl.id_bacsi = ?
    `;
    const params = [id_bacsi];
    if (ngay) {
      query += " AND dl.ngay = ?";
      params.push(ngay);
    }
    query += " ORDER BY dl.ngay DESC, dl.khung_gio ASC";

    const [lichKham] = await db.query(query, params);

    if (!lichKham.length) {
      return res.status(200).json({
        success: true,
        message: "Không có lịch khám nào cho bác sĩ này.",
        data: [],
      });
    }

    // 🔗 Kèm thông tin bệnh nhân (nếu đã có hồ sơ khám)
    const fullSchedules = await Promise.all(
      lichKham.map(async (lich) => {
        const [hoso] = await db.query(
          `SELECT id_hoso, id_benhnhan, trang_thai FROM ho_so_kham WHERE id_datlich = ? LIMIT 1`,
          [lich.id_datlich]
        );

        if (hoso.length > 0) {
          const id_benhnhan = hoso[0].id_benhnhan;
          const [bn] = await db.query(
            `SELECT id_benhnhan, ho_ten, phone, email, gioi_tinh, ngay_sinh, dia_chi, so_bhyt
             FROM benhnhan WHERE id_benhnhan = ?`,
            [id_benhnhan]
          );
          lich.benhnhan = bn[0] || null;
          lich.trang_thai_kham = hoso[0].trang_thai;
        } else {
          lich.benhnhan = {
            ho_ten: lich.ten_benhnhan,
            phone: lich.sdt,
            email: lich.email,
          };
          lich.trang_thai_kham = "CHƯA_TẠO_HỒ_SƠ";
        }

        return lich;
      })
    );

    res.status(200).json({
      success: true,
      total: fullSchedules.length,
      message: "Lấy lịch khám và thông tin bệnh nhân thành công.",
      data: fullSchedules,
    });
  } catch (error) {
    console.error("❌ Lỗi tại DoctorDHST.controller:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy lịch khám.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ====================== 👨‍⚕️ LẤY HỒ SƠ BÁC SĨ ======================
const getDoctorProfile = async (req, res) => {
  try {
    const { id_bacsi } = req.query;

    if (!id_bacsi?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID bác sĩ (id_bacsi).",
      });
    }

    const [rows] = await db.query(
      `SELECT 
        b.id_bacsi, b.ho_ten, b.hinh_anh, b.hoc_vi, b.chuc_vu, b.chuyen_mon,
        b.qua_trinh_dao_tao, b.qua_trinh_cong_tac, b.the_manh_kinh_nghiem,
        b.nam_kinh_nghiem, b.email, b.phone, b.diachi,
        k.ten_khoa
      FROM bacsi b
      LEFT JOIN khoa k ON b.id_khoa = k.id_khoa
      WHERE b.id_bacsi = ?`,
      [id_bacsi]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ bác sĩ.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lấy hồ sơ bác sĩ thành công.",
      data: rows[0],
    });
  } catch (error) {
    console.error("❌ Lỗi tại getDoctorProfile:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy hồ sơ bác sĩ.",
    });
  }
};

// ====================== EXPORT ======================
module.exports = { getDoctorDHST, getDoctorProfile };
