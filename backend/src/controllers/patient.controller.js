// controllers/patient.controller.js
const patientModel = require('../models/patientModel');
const otpService = require('../services/otpService');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// --- Hàm định dạng ngày (yyyy-mm-dd → dd/mm/yyyy)
const formatDbDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
        return typeof dateValue === 'string' && dateValue.length <= 10
            ? dateValue.split('-').reverse().join('/')
            : 'N/A';
    }
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// --- 1️⃣ Gửi số điện thoại và yêu cầu OTP ---
exports.requestOtp = async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber)
        return res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại.' });

    try {
        const patients = await patientModel.findPatientsByPhone(phoneNumber);

        if (patients.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy bệnh nhân nào có số điện thoại này.'
            });
        }

        const success = await otpService.sendOtp(phoneNumber);
        if (!success) throw new Error('Lỗi gửi OTP');

        res.json({
            message: 'Đã gửi mã OTP đến số điện thoại của bạn.',
            phoneNumber
        });
    } catch (err) {
        console.error('Error requestOtp:', err);
        res.status(500).json({ message: 'Lỗi hệ thống khi gửi mã OTP.' });
    }
};

// --- 2️⃣ Xác thực OTP và lấy danh sách bệnh nhân ---
exports.verifyOtpAndGetPatients = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp)
        return res.status(400).json({ message: 'Thiếu số điện thoại hoặc mã OTP.' });

    try {
        const isValid = await otpService.verifyOtp(phoneNumber, otp);
        if (!isValid)
            return res.status(401).json({ message: 'Mã OTP không hợp lệ hoặc hết hạn.' });

        const patients = await patientModel.findPatientsByPhone(phoneNumber);

        res.json({
            message: 'Xác thực thành công.',
            patients: patients.map(p => ({
                id_benhnhan: p.id_benhnhan,
                ho_ten: p.ho_ten,
                ngay_sinh: formatDbDate(p.ngay_sinh),
                gioi_tinh: p.gioi_tinh
            }))
        });
    } catch (err) {
        console.error('Error verifyOtp:', err);
        res.status(500).json({ message: 'Lỗi hệ thống khi xác thực OTP.' });
    }
};

// --- 3️⃣ Lấy danh sách các lần khám của bệnh nhân ---
exports.getPatientVisits = async (req, res) => {
    const { patientId } = req.params;

    try {
        const visits = await patientModel.getVisitsByPatientId(patientId);
        if (!visits || visits.length === 0)
            return res.status(404).json({ message: 'Bệnh nhân chưa có lần khám nào.' });

        res.json({
            visits: visits.map(v => ({
                id_lichkham: v.id_lichkham,
                ngay_kham: formatDbDate(v.ngay_kham),
                khoa: v.ten_khoa,
                bacsi: v.ten_bacsi,
                chan_doan_tom_tat: v.ket_qua || 'Chưa cập nhật'
            }))
        });
    } catch (err) {
        console.error('Error getPatientVisits:', err);
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy danh sách khám.' });
    }
};

// --- 4️⃣ Lấy chi tiết 1 lần khám ---
exports.getVisitDetails = async (req, res) => {
    const { lichKhamId } = req.params;

    try {
        const details = await patientModel.getVisitDetails(lichKhamId);
        if (!details)
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ khám bệnh.' });

        res.json({ details });
    } catch (err) {
        console.error('Error getVisitDetails:', err);
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy chi tiết hồ sơ.' });
    }
};

// --- 5️⃣ Xuất PDF hồ sơ khám bệnh ---




exports.downloadVisitPdf = async (req, res) => {
    try {
        const details = await patientModel.getVisitDetails(req.params.lichKhamId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=hoso.pdf');

        // ✅ 1. TẠO DOC TRƯỚC
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);
        doc.rect(40, 30, 515, 780).strokeColor('#000').lineWidth(1).stroke();

        // ✅ 2. LOAD FONT SAU KHI CÓ DOC
          const fontPath = path.resolve(__dirname, '..', 'vietnam-font.ttf');
        if (fs.existsSync(fontPath)) {
            doc.registerFont('VN', fontPath);
            doc.font('VN');
        } else {
            console.warn('⚠ Không tìm thấy font Unicode, fallback Helvetica');
            doc.font('Helvetica');
        }

        // ===== PDF CONTENT =====
        doc.fontSize(18).text('BỆNH ÁN ĐIỆN TỬ - DHST HOSPITAL', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10)
   .text('Địa chỉ: Công nghiệp Hà Nội ,Bắc Từ Liêm , Hà Nội ', { align: 'center' })
   .text('Hotline: 6868686868', { align: 'center' });

doc.moveDown(0.5);
doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
doc.moveDown();

// ================= TITLE =================
doc.fontSize(18)
   .font('VN')
   .text('BỆNH ÁN NGOẠI TRÚ', { align: 'center', underline: true });

doc.moveDown(1.5);

        doc.fontSize(13).text('THÔNG TIN BỆNH NHÂN', { underline: true });
        doc.fontSize(11);
        doc.text(`Họ tên: ${details.ho_ten_bn}`);
        doc.text(`Ngày sinh: ${formatDbDate(details.ngay_sinh_bn)}   Giới tính: ${details.gioi_tinh_bn}`);
        doc.text(`SĐT: ${details.sdt_bn}`);
        doc.text(`Email: ${details.email_bn}`);
        doc.moveDown();

        doc.fontSize(13).text('THÔNG TIN KHÁM BỆNH', { underline: true });
        doc.fontSize(11);
        doc.text(`Ngày khám: ${formatDbDate(details.ngay_kham)}`);
        doc.text(`Bác sĩ: BS. ${details.ten_bacsi}`);
        doc.text(`Chuyên khoa: ${details.chuyen_khoa}`);
        doc.moveDown();

        doc.fontSize(13).text('CHI TIẾT BỆNH ÁN', { underline: true });
        doc.fontSize(11);
        doc.text(`Chẩn đoán: ${details.chuan_doan}`);
        doc.text(`Triệu chứng: ${details.trieu_chung}`);
        doc.text(`Ghi chú: ${details.ghi_chu}`);
        doc.moveDown();

        doc.fontSize(13).text('ĐƠN THUỐC KÊ ĐƠN', { underline: true });
        doc.fontSize(13).text('III. ĐƠN THUỐC', { underline: true });
doc.moveDown(0.5);

const tableX = 50;
let tableY = doc.y;
const rowH = 22;
const colW = [40, 200, 90, 110, 60];
const headers = ['STT', 'Tên thuốc', 'Liều lượng', 'Cách dùng', 'Số ngày'];

// Header
let x = tableX;
headers.forEach((h, i) => {
    doc.rect(x, tableY, colW[i], rowH).stroke();
    doc.text(h, x + 4, tableY + 6);
    x += colW[i];
});

tableY += rowH;

// Rows
details.thuoc_ke_don.forEach((t, i) => {
    x = tableX;
    const row = [
        i + 1,
        t.ten_thuoc,
        t.lieu_luong,
        t.cach_dung,
        t.so_ngay
    ];

    row.forEach((cell, j) => {
        doc.rect(x, tableY, colW[j], rowH).stroke();
        doc.text(String(cell), x + 4, tableY + 6);
        x += colW[j];
    });

    tableY += rowH;
});



doc.moveDown(3);

doc.text('BÁC SĨ ĐIỀU TRỊ', 380);
doc.moveDown(3);
doc.text(`BS. ${details.ten_bacsi}`, 380);

doc.moveDown(2);
doc.fontSize(9).fillColor('#555')
   .text('Văn bản này được trích xuất từ Hệ thống Quản lý Bệnh viện DHST',
         { align: 'center' });

         doc.end();
doc.moveDown(2);

    } catch (err) {
        console.error('❌ Lỗi tạo PDF:', err);
        if (!res.headersSent) res.status(500).send('Lỗi tạo PDF');
    }
};

      
/**
 * ✅ API MỚI: Lấy thông tin bệnh nhân theo số điện thoại (dành cho lễ tân)
 * GET /api/patient/phone/:sdt
 */
exports.getPatientByPhone = async (req, res) => {
    try {
        const { sdt } = req.params;
        if (!sdt) return res.status(400).json({ message: "Thiếu số điện thoại." });

        const patients = await patientModel.findPatientsByPhone(sdt);
        if (!patients.length)
            return res.status(404).json({ message: "Không tìm thấy bệnh nhân." });

        res.json({
            success: true,
            data: patients.map(p => ({
                id_benhnhan: p.id_benhnhan,
                ho_ten: p.ho_ten,
                ngay_sinh: formatDbDate(p.ngay_sinh),
                gioi_tinh: p.gio_tinh,
                email: p.email,
                dia_chi: p.dia_chi,
                sdt: p.phone
            }))
        });
    } catch (err) {
        console.error("❌ Lỗi getPatientByPhone:", err.message);
        res.status(500).json({ message: "Lỗi hệ thống khi tìm bệnh nhân theo SĐT." });
    }
};