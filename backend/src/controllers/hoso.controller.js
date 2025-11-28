// src/controllers/hoso.controller.js
const HoSoModel = require('../models/hoso.model');
const DatLichModel = require('../models/datlich.model');
const BenhNhanModel = require('../models/benhnhan.model');
const db = require('../../config/db');

/**
 * Tạo hồ sơ từ dat_lich (lễ tân khi bệnh nhân tới)
 */
const createFromDatLich = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id_datlich, id_benhnhan, id_bacsi, trieu_chung = '', chuan_doan = '', ghi_chu = '' } = req.body;
    if (!id_datlich || !id_benhnhan || !id_bacsi) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Thiếu id_datlich / id_benhnhan / id_bacsi.' });
    }

    const newHoso = await HoSoModel.createFromDatLichWithPriority({
      id_datlich,
      id_benhnhan,
      id_bacsi,
      trieu_chung,
      chuan_doan,
      ghi_chu
    }, connection);

    await DatLichModel.updateTrangThai(id_datlich, 'DA_TAO_HOSO', connection);
    await connection.commit();
    res.status(201).json({ success: true, data: newHoso });
  } catch (err) {
    await connection.rollback();
    console.error('Lỗi createFromDatLich:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi tạo hồ sơ.' });
  } finally {
    connection.release();
  }
};

/**
 * Tạo hồ sơ walk-in (không đặt lịch)
 */
const createWalkin = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id_benhnhan, id_bacsi, trieu_chung = '', chuan_doan = '', ghi_chu = '' } = req.body;
    if (!id_benhnhan || !id_bacsi) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Thiếu id_benhnhan hoặc id_bacsi.' });
    }

    const newHoso = await HoSoModel.create({
      id_datlich: null,
      id_benhnhan,
      id_bacsi,
      trieu_chung,
      chuan_doan,
      ghi_chu,
      uu_tien: 0
    }, connection);

    await connection.commit();
    res.status(201).json({ success: true, data: newHoso });
  } catch (err) {
    await connection.rollback();
    console.error('Lỗi createWalkin:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi tạo hồ sơ walk-in.' });
  } finally {
    connection.release();
  }
};

/**
 * Xác nhận bệnh nhân đã đến
 */
const confirmArrival = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id_hoso } = req.params;
    if (!id_hoso) return res.status(400).json({ success: false, message: 'Thiếu id_hoso' });

    await connection.beginTransaction();
    const now = new Date();
    await HoSoModel.confirmArrival(id_hoso, now, { connection });

    await connection.commit();
    res.json({ success: true, message: 'Xác nhận bệnh nhân đã đến thành công.', thoi_gian_den: now });
  } catch (err) {
    await connection.rollback();
    console.error('Lỗi confirmArrival:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi xác nhận bệnh nhân đến.' });
  } finally {
    connection.release();
  }
};

/**
 * Lấy chi tiết hồ sơ
 */
const getHoSoChiTiet = async (req, res) => {
  try {
    const { id_hoso } = req.params;
    const hoso = await HoSoModel.findById(id_hoso);
    if (!hoso) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ.' });
    res.json({ success: true, data: hoso });
  } catch (err) {
    console.error('Lỗi getHoSoChiTiet:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy hồ sơ.' });
  }
};

/**
 * Lấy danh sách bệnh nhân cho bác sĩ
 */
const getDanhSachBenhNhanTheoBacSi = async (req, res) => {
  try {
    const { id_bacsi } = req.params;
    const { ngay } = req.query;
    const data = await HoSoModel.findByDoctorOrdered(id_bacsi, ngay);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Lỗi getDanhSachBenhNhanTheoBacSi:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách bệnh nhân.' });
  }
};

/**
 * ✅ HÀM MỚI: Tự động tạo hồ sơ (dùng cho đặt lịch lễ tân)
 */
const autoCreateHoSo = async (id_datlich, id_benhnhan, id_bacsi) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO ho_so_kham (id_datlich, id_benhnhan, id_bacsi, trang_thai, ngay_tao)
       VALUES (?, ?, ?, 'CHO_KHAM', NOW())`,
      [id_datlich, id_benhnhan, id_bacsi]
    );
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error('❌ Lỗi autoCreateHoSo:', err.message);
  } finally {
    connection.release();
  }
};

/**
 * ✅ HÀM MỚI: Lấy tất cả hồ sơ theo bệnh nhân
 */
const getByBenhNhan = async (req, res) => {
  try {
    const { id_benhnhan } = req.params;
    const [rows] = await db.query(
      `SELECT * FROM ho_so_kham WHERE id_benhnhan = ? ORDER BY ngay_tao DESC`,
      [id_benhnhan]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ Lỗi getByBenhNhan:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy hồ sơ bệnh nhân.' });
  }
};

module.exports = {
  createFromDatLich,
  createWalkin,
  confirmArrival,
  getHoSoChiTiet,
  getDanhSachBenhNhanTheoBacSi,
  autoCreateHoSo,      // ✅ thêm
  getByBenhNhan        // ✅ thêm
};
