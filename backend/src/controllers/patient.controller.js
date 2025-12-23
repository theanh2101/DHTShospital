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
        // Nếu là string dạng ISO hoặc yyyy-mm-dd
        return typeof dateValue === 'string' && dateValue.length >= 10
            ? dateValue.substring(0, 10).split('-').reverse().join('/')
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
// 🔥 ĐÃ SỬA: Map đúng tên trường ten_khoa, ten_bacsi để khớp Frontend
exports.getPatientVisits = async (req, res) => {
    const { patientId } = req.params;

    try {
        const visits = await patientModel.getVisitsByPatientId(patientId);
        
        // Log kiểm tra data từ Model (có thể xóa sau này)
        // console.log("Visits from DB:", visits);

        if (!visits || visits.length === 0)
            return res.status(404).json({ message: 'Bệnh nhân chưa có lần khám nào.' });

        res.json({
            visits: visits.map(v => ({
                id_lichkham: v.id_lichkham,
                ngay_kham: formatDbDate(v.ngay_kham),
                
                // 👇 CẬP NHẬT: Trả về đúng key mà Frontend đang tìm
                ten_khoa: v.ten_khoa || 'Khoa Khám Bệnh', 
                ten_bacsi: v.ten_bacsi || 'Chưa cập nhật',
                ket_qua: v.ket_qua || 'Đang cập nhật' 
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

        if (!details) {
            return res.status(404).send('Không tìm thấy dữ liệu để xuất PDF');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=HoSo_${req.params.lichKhamId}.pdf`);

        // ✅ TẠO DOC
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);
        
        // Vẽ khung viền trang
        doc.rect(40, 30, 515, 780).strokeColor('#000').lineWidth(1).stroke();

        // ✅ LOAD FONT TIẾNG VIỆT
        const fontPath = path.resolve(__dirname, '..', 'vietnam-font.ttf'); // Đảm bảo đường dẫn font đúng
        if (fs.existsSync(fontPath)) {
            doc.registerFont('VN', fontPath);
            doc.font('VN');
        } else {
            console.warn('⚠ Không tìm thấy font Unicode, fallback Helvetica (sẽ lỗi font tiếng Việt)');
            doc.font('Helvetica');
        }

        // ===== PDF CONTENT =====
        // Header
        doc.fontSize(18).text('BỆNH ÁN ĐIỆN TỬ - DHST HOSPITAL', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10)
           .text('Địa chỉ: Công nghiệp Hà Nội, Bắc Từ Liêm, Hà Nội', { align: 'center' })
           .text('Hotline: 1900.888.666', { align: 'center' });

        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown();

        // Title
        doc.fontSize(18).font('VN').text('BỆNH ÁN NGOẠI TRÚ', { align: 'center', underline: true });
        doc.moveDown(1.5);

        // Thông tin Bệnh nhân
        doc.fontSize(13).text('THÔNG TIN BỆNH NHÂN', { underline: true });
        doc.fontSize(11);
        doc.text(`Họ tên: ${details.ho_ten_bn}`);
        doc.text(`Ngày sinh: ${formatDbDate(details.ngay_sinh_bn)}    Giới tính: ${details.gioi_tinh_bn}`);
        doc.text(`SĐT: ${details.sdt_bn}`);
        doc.text(`Email: ${details.email_bn || 'Không có'}`);
        doc.moveDown();

        // Thông tin Khám bệnh
        doc.fontSize(13).text('THÔNG TIN KHÁM BỆNH', { underline: true });
        doc.fontSize(11);
        doc.text(`Ngày khám: ${formatDbDate(details.ngay_kham)}`);
        doc.text(`Bác sĩ: BS. ${details.ten_bacsi}`);
        doc.text(`Chuyên khoa: ${details.chuyen_khoa}`);
        doc.moveDown();

        // Chi tiết bệnh án
        doc.fontSize(13).text('CHI TIẾT BỆNH ÁN', { underline: true });
        doc.fontSize(11);
        doc.text(`Chẩn đoán: ${details.chuan_doan}`);
        doc.text(`Triệu chứng: ${details.trieu_chung}`);
        doc.text(`Ghi chú: ${details.ghi_chu}`);
        doc.moveDown();

        // Bảng Đơn thuốc
        doc.fontSize(13).text('ĐƠN THUỐC KÊ ĐƠN', { underline: true });
        doc.moveDown(0.5);

        if (details.thuoc_ke_don && details.thuoc_ke_don.length > 0) {
            const tableX = 50;
            let tableY = doc.y;
            const rowH = 25; // Tăng chiều cao dòng một chút
            const colW = [40, 200, 90, 110, 60];
            const headers = ['STT', 'Tên thuốc', 'Liều lượng', 'Cách dùng', 'Số ngày'];

            // Vẽ Header Bảng
            let x = tableX;
            doc.font('VN').fontSize(11); // Set lại font size cho bảng
            headers.forEach((h, i) => {
                doc.rect(x, tableY, colW[i], rowH).fillAndStroke('#eee', '#000'); // Tô nền header
                doc.fillColor('#000').text(h, x + 5, tableY + 8);
                x += colW[i];
            });

            tableY += rowH;

            // Vẽ Rows
            details.thuoc_ke_don.forEach((t, i) => {
                // Kiểm tra nếu gần hết trang thì add trang mới
                if (tableY > 750) {
                    doc.addPage();
                    tableY = 50;
                }

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
                    doc.text(String(cell || ''), x + 5, tableY + 8);
                    x += colW[j];
                });

                tableY += rowH;
            });
        } else {
            doc.fontSize(11).text('Không có thuốc được kê đơn.', { italic: true });
        }

        // Chữ ký
        doc.moveDown(3);
        const signatureY = doc.y;
        doc.text('BÁC SĨ ĐIỀU TRỊ', 380, signatureY, { align: 'center', width: 150 });
        doc.moveDown(4);
        doc.text(`BS. ${details.ten_bacsi}`, 380, doc.y, { align: 'center', width: 150 });

        // Footer note
        doc.moveDown(2);
        doc.fontSize(9).fillColor('#555')
           .text('Văn bản này được trích xuất từ Hệ thống Quản lý Bệnh viện DHST', 50, 780,
                 { align: 'center', width: 500 });

        // Kết thúc file PDF
        doc.end();

    } catch (err) {
        console.error('❌ Lỗi tạo PDF:', err);
        if (!res.headersSent) res.status(500).send('Lỗi tạo PDF');
    }
};
      
// --- API Lấy thông tin bệnh nhân theo SĐT (cho Lễ tân/Admin) ---
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
                gioi_tinh: p.gioi_tinh, // Lưu ý: trong DB là gioi_tinh hay gio_tinh? Check lại model
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