// models/patientModel.js
const db = require('../../config/db');

// 1. Tìm bệnh nhân theo SĐT
exports.findPatientsByPhone = async (phoneNumber) => {
    // 💡 SỬ DỤNG HÀM TRIM() CỦA MYSQL TRONG CÂU TRUY VẤN
    const [rows] = await db.execute(
        // Lệnh TRIM() loại bỏ khoảng trắng thừa ở đầu và cuối cột phone
        `SELECT id_benhnhan, ho_ten, gioi_tinh, ngay_sinh, dia_chi, so_bhyt 
         FROM benhnhan 
         WHERE TRIM(phone) = ?`, 
        [phoneNumber]
    );

    // Thêm log kiểm tra kết quả trả về
    console.log(`[DB] Đang tìm SĐT: "${phoneNumber}". Kết quả: ${rows.length} hàng.`); 

    return rows;
};

// 2. Lấy danh sách lần khám theo ID Bệnh nhân
exports.getVisitsByPatientId = async (patientId) => {
    console.log(`[DB] Đang lấy lịch sử khám cho ID_BN: ${patientId}`);
    
    // Đảm bảo các alias cột (lk, dl, k, bs) được sử dụng đúng
    const [rows] = await db.execute(
        `SELECT 
            lk.id_lichkham, 
            dl.ngay_dat, 
            k.ten_khoa, 
            bs.ho_ten AS ten_bacsi,
            lk.ngay_kham,
            lk.ket_qua
        FROM lichkham lk
        JOIN datlich dl ON lk.id_datlich = dl.id_datlich /* Liên kết Lịch khám và Đặt lịch */
        JOIN benhnhan bn ON dl.id_benhnhan = bn.id_benhnhan /* Liên kết Đặt lịch và Bệnh nhân */
        JOIN khoa k ON dl.id_khoa = k.id_khoa /* Liên kết Khoa */
        LEFT JOIN bacsi bs ON dl.id_bacsi = bs.id_bacsi /* Liên kết Bác sĩ */
        WHERE bn.id_benhnhan = ?
        ORDER BY lk.ngay_kham DESC`,
        [patientId]
    );
    
    console.log(`[DB] Tổng số lần khám tìm thấy: ${rows.length}`);
    return rows;
};

// 3. Lấy chi tiết hồ sơ khám bệnh theo ID Lịch khám
exports.getVisitDetails = async (lichKhamId) => {
    const [rows] = await db.execute(
        `SELECT 
            hkb.chan_doan, 
            hkb.trieu_chung, 
            hkb.thuoc_ke_don, 
            hkb.ghi_chu,
            lk.ket_qua
        FROM hosokhambenh hkb
        JOIN lichkham lk ON hkb.id_lichkham = lk.id_lichkham
        WHERE hkb.id_lichkham = ?`,
        [lichKhamId]
    );
    return rows[0];
};