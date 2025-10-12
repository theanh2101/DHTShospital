const nodemailer = require('nodemailer');

// Cấu hình người gửi mail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// Hàm tạo và gửi email
const sendBookingConfirmationEmail = async (details) => {

    console.log("--- Bắt đầu quá trình gửi email ---"); 
    const { appointment, doctor, ten_khoa } = details;

    const patientEmail = appointment.email;

    if (!patientEmail) {
        console.log(">>> KẾT QUẢ: Bệnh nhân không cung cấp email. Dừng gửi.");
        return;
    }
    const mailOptions = {
        from: `"DHST Healthcare" <${process.env.GMAIL_USER}>`,
        to: appointment.email, 
        subject: `Xác nhận lịch hẹn #${appointment.id_datlich} tại DHST Healthcare`,
        html: `
            <h3>Kính gửi ${appointment.ten_benhnhan},</h3>
            <p>Cảm ơn bạn đã đặt lịch hẹn tại DHST Healthcare. Lịch hẹn của bạn đã được ghi nhận thành công.</p>
            <p><strong>Thông tin lịch hẹn:</strong></p>
            <ul>
    
                <li>Mã lịch hẹn: <strong>DL-${appointment.id_datlich}</strong></li>
                <li>Khoa khám: <strong>${ten_khoa}</strong></li> 
                <li>Ngày khám: <strong>${new Date(appointment.ngay).toLocaleDateString('vi-VN')}</strong></li>
                <li>Giờ khám: <strong>${appointment.khung_gio}</strong></li>
                <li>Bác sĩ phụ trách: <strong>${doctor.ho_ten}</strong></li>
            </ul>
            <p>Vui lòng đến trước 15 phút để làm thủ tục. Trân trọng!</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Đã gửi email xác nhận tới: ${appointment.email}`);
    } catch (error) {
        console.error(`❌ Lỗi khi gửi email:`, error);
    }
};

module.exports = { sendBookingConfirmationEmail };