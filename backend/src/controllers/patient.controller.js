// controllers/patientController.js
const patientModel = require('../models/patientModel');
const otpService = require('../services/otpService');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs'); 

// --- Hàm tiện ích định dạng ngày tháng (từ Date object sang string) ---
const formatDbDate = (dateObject) => {
    if (dateObject instanceof Date) {
        return dateObject.toISOString().substring(0, 10).split('-').reverse().join('/');
    }
    return 'N/A';
};


// --- 1. Gửi SĐT và Yêu cầu OTP (Giữ nguyên)
exports.requestOtp = async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại.' });
    }

    try {
        const patients = await patientModel.findPatientsByPhone(phoneNumber);

        if (patients.length === 0) {
            return res.status(404).json({ 
                message: 'Thông báo: Không tìm thấy bệnh nhân nào có số điện thoại này trong hệ thống. Vui lòng kiểm tra lại.' 
            });
        }

        const success = await otpService.sendOtp(phoneNumber);

        if (success) {
            return res.json({ 
                message: 'Tìm thấy thông tin. Mã OTP đã được gửi đến SĐT của bạn để xác thực.' 
            });
        } else {
            return res.status(500).json({ message: 'Lỗi khi gửi OTP. Vui lòng thử lại.' });
        }
    } catch (error) {
        console.error('Error requesting OTP:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tìm kiếm hoặc gửi OTP.' });
    }
};

// --- 2. Xác thực OTP và Lấy danh sách bệnh nhân (Giữ nguyên)
exports.verifyOtpAndGetPatients = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại và mã OTP.' });
    }

    const isValid = await otpService.verifyOtp(phoneNumber, otp);

    if (!isValid) {
        return res.status(401).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.' });
    }

    try {
        const patients = await patientModel.findPatientsByPhone(phoneNumber);

        return res.json({
            message: 'Xác thực thành công.',
            patients: patients.map(p => ({
                id_benhnhan: p.id_benhnhan,
                ho_ten: p.ho_ten,
                ngay_sinh: p.ngay_sinh,
                gioi_tinh: p.gioi_tinh
            }))
        });

    } catch (error) {
        console.error('Error verifying OTP and getting patients:', error);
        res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};

// --- 3. Lấy danh sách lần khám của Bệnh nhân (Giữ nguyên)
exports.getPatientVisits = async (req, res) => {
    const { patientId } = req.params;

    try {
        const visits = await patientModel.getVisitsByPatientId(patientId);

        if (visits.length === 0) {
            return res.status(404).json({ message: 'Bệnh nhân này chưa có lịch khám nào được lưu.' });
        }

        return res.json({ 
            visits: visits.map(v => ({
                id_lichkham: v.id_lichkham,
                ngay_kham: v.ngay_kham,
                khoa: v.ten_khoa,
                bacsi: v.ten_bacsi,
                chan_doan_tom_tat: v.ket_qua 
            }))
        });
    } catch (error) {
        console.error('Error fetching patient visits:', error);
        res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};

// --- 4. Lấy chi tiết của một Lần khám cụ thể (Giữ nguyên)
exports.getVisitDetails = async (req, res) => {
    const { lichKhamId } = req.params;

    try {
        const details = await patientModel.getVisitDetails(lichKhamId);

        if (!details) {
            return res.status(404).json({ message: 'Không tìm thấy chi tiết hồ sơ khám bệnh cho lần khám này.' });
        }

        return res.json({ details });
    } catch (error) {
        console.error('Error fetching visit details:', error);
        res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};

// --- 5. Tải file PDF (ĐÃ SỬA LỖI ĐƯỜNG DẪN FONT VÀ TÊN FILE)
exports.downloadVisitPdf = async (req, res) => {
    const { lichKhamId } = req.params;

    try {
        // 1. LẤY DỮ LIỆU THẬT từ Database
        const details = await patientModel.getVisitDetails(lichKhamId);

        if (!details) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu hồ sơ để tạo PDF.' });
        }
        
        // --- Chuẩn bị Dữ liệu ---
        const patientName = details.ho_ten_bn || 'Bệnh nhân';
        const doctorName = details.ten_bacsi || 'Bác sĩ';
        const ngayKhamFormatted = formatDbDate(details.ngay_kham);
        const ngaySinhFormatted = formatDbDate(details.ngay_sinh_bn);
        const fileName = `HoSoKhamBenh_${patientName.replace(/\s/g, '_')}_REC-${lichKhamId}.pdf`;

        // 2. KHỞI TẠO VÀ CẤU HÌNH HEADER
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        doc.pipe(res); 
        
        // 💡 BƯỚC FIX FONT: SỬ DỤNG path.resolve VÀ TÊN FILE ĐƠN GIẢN
        const FONT_FILENAME = 'vietnam-font.ttf'; // <<< Tên file đã được đơn giản hóa
        
        // Tạo đường dẫn tuyệt đối ổn định từ thư mục controller đến thư mục src/fonts
        const VN_FONT_PATH = path.resolve(__dirname, '..', FONT_FILENAME);

        // Kiểm tra file tồn tại và nhúng font
        if (fs.existsSync(VN_FONT_PATH)) {
             doc.registerFont('Times-VN', VN_FONT_PATH);
             doc.font('Times-VN');
        } else {
             console.error(`[PDF Font Critical Error] KHÔNG TÌM THẤY FONT TIẾNG VIỆT! Vui lòng kiểm tra file: ${VN_FONT_PATH}`);
             // Nếu không tìm thấy font, sử dụng font cơ bản và chấp nhận lỗi ký tự.
             doc.font('Helvetica'); 
        }

        // ==========================================================
        // 3. IN NỘI DUNG RA PDF (Giống hiển thị chi tiết bệnh án)
        // ==========================================================

        doc.fontSize(20).text('BỆNH ÁN ĐIỆN TỬ DHST HOSPITAL', { align: 'center' }).moveDown();
        
        // --- Thông tin Bệnh nhân ---
        doc.fontSize(14).fillColor('#0A66C2').text('THÔNG TIN BỆNH NHÂN:').moveDown(0.5);
        doc.fillColor('#333333').fontSize(12)
           .text(`- Họ tên: ${patientName}`).moveDown(0.1);
        doc.text(`- Ngày sinh: ${ngaySinhFormatted}`, { continued: true })
           .text(`Giới tính: ${details.gioi_tinh_bn || 'N/A'}`).moveDown(0.2);

        // --- Bác sĩ & Lần khám ---
        doc.fontSize(14).fillColor('#f4b400').text('BÁC SĨ & LẦN KHÁM:').moveDown(0.5);
        doc.fillColor('#333333').fontSize(12)
           .text(`- Mã hồ sơ: REC-${lichKhamId}`, { continued: true })
           .text(`Ngày khám: ${ngayKhamFormatted}`).moveDown(0.2);
        doc.text(`- Bác sĩ: BS. ${doctorName}`, { continued: true })
           .text(`Chuyên khoa: ${details.chuyen_khoa || 'N/A'}`).moveDown();

        // --- Chi tiết Bệnh án ---
        doc.fontSize(14).fillColor('#CC0000').text('CHI TIẾT BỆNH ÁN:').moveDown(0.5);
        doc.fillColor('#333333').fontSize(12)
           .text(`Chẩn đoán: ${details.chan_doan || 'N/A'}`).moveDown(0.2);
        doc.text(`Triệu chứng: ${details.trieu_chung || 'N/A'}`).moveDown(0.2);
        doc.text(`Ghi chú BS: ${details.ghi_chu || 'Không có.'}`).moveDown();
           
        // --- Đơn thuốc ---
        doc.fontSize(14).fillColor('#28a745').text('ĐƠN THUỐC KÊ ĐƠN:').moveDown(0.5);
        
        if (details.thuoc_ke_don) {
            try {
                const medicationArray = JSON.parse(details.thuoc_ke_don);
                medicationArray.forEach((m, index) => {
                    doc.fillColor('#333333').fontSize(12)
                       .text(`${index + 1}. ${m.ten_thuoc || 'N/A'}: ${m.lieu_luong || 'N/A'}. Cách dùng: ${m.cach_dung || 'N/A'}. Thời gian: ${m.thoi_gian || 'N/A'}`).moveDown(0.1);
                });
            } catch (e) {
                doc.fillColor('#333333').fontSize(12).text(details.thuoc_ke_don).moveDown(0.1);
            }
        } else {
            doc.fillColor('#333333').fontSize(12).text('Không có thuốc được kê đơn.');
        }

        // 4. Kết thúc Document (Gửi PDF)
        doc.end();

    } catch (error) {
        console.error(`[PDF Error] Lỗi khi tạo PDF cho ID ${lichKhamId}:`, error);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Lỗi server khi tạo tệp PDF. (Lỗi trong quá trình ghi dữ liệu)' });
        }
    }
};