// controllers/patientController.js
const patientModel = require('../models/patientModel');
const otpService = require('../services/otpService');

// --- 1. Gửi SĐT và Yêu cầu OTP
exports.requestOtp = async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại.' });
    }

    try {
        // 1. Kiểm tra SĐT có trong DB không
        const patients = await patientModel.findPatientsByPhone(phoneNumber);

        if (patients.length === 0) {
            return res.status(404).json({ 
                message: 'Thông báo: Không tìm thấy bệnh nhân nào có số điện thoại này trong hệ thống. Vui lòng kiểm tra lại.' 
            });
        }

        // 2. Tạo và Gửi OTP
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

// --- 2. Xác thực OTP và Lấy danh sách bệnh nhân
exports.verifyOtpAndGetPatients = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại và mã OTP.' });
    }

    // 1. Xác thực OTP
    const isValid = await otpService.verifyOtp(phoneNumber, otp);

    if (!isValid) {
        return res.status(401).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.' });
    }

  try {
        const patients = await patientModel.findPatientsByPhone(phoneNumber);

        // 💡 BẮT BUỘC TRẢ VỀ TÊN CỘT CHÍNH XÁC TỪ CSDL: id_benhnhan
        return res.json({
            message: 'Xác thực thành công.',
            patients: patients.map(p => ({
                id_benhnhan: p.id_benhnhan, // GIỮ NGUYÊN TÊN CỘT CỦA CSDL
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

// --- 3. Lấy danh sách lần khám của Bệnh nhân
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
                chan_doan_tom_tat: v.ket_qua // Sử dụng kết quả lịch khám làm tóm tắt
            }))
        });
    } catch (error) {
        console.error('Error fetching patient visits:', error);
        res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};

// --- 4. Lấy chi tiết của một Lần khám cụ thể (Hồ sơ khám bệnh)
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