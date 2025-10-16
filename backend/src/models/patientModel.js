// src/models/patientModel.js
const db = require('../../config/db');

// 1. Tìm bệnh nhân theo SĐT (BENHNHAN)
exports.findPatientsByPhone = async (phoneNumber) => {
    // Sử dụng TRIM() và kiểm tra SĐT
    const [rows] = await db.execute(
        `SELECT id_benhnhan, ho_ten, gioi_tinh, ngay_sinh, dia_chi, so_bhyt, phone 
         FROM benhnhan 
         WHERE TRIM(phone) = ?`, 
        [phoneNumber]
    );

    console.log(`[DB] Đang tìm SĐT: "${phoneNumber}". Kết quả: ${rows.length} hàng.`); 
    return rows;
};

// 2. Lấy danh sách lần khám theo ID Bệnh nhân (HO_SO_KHAM)
exports.getVisitsByPatientId = async (patientId) => {
    console.log(`[DB] Đang lấy lịch sử khám cho ID_BN: ${patientId}`);
    
    // TRUY VẤN: HO_SO_KHAM (hsk) JOIN DAT_LICH (dl)
    const [rows] = await db.execute(
        `SELECT 
            hsk.id_hoso AS id_lichkham, /* Sử dụng id_hoso làm ID lần khám */
            dl.ngay AS ngay_dat, /* Ngày đặt lịch */
            k.ten_khoa, 
            bs.ho_ten AS ten_bacsi,
            hsk.ngay_tao AS ngay_kham, /* Ngày tạo hồ sơ (tương đương ngày khám) */
            hsk.chuan_doan AS ket_qua /* Chẩn đoán làm tóm tắt kết quả */
        FROM ho_so_kham hsk
        JOIN dat_lich dl ON hsk.id_datlich = dl.id_datlich /* JOIN DAT_LICH */
        JOIN khoa k ON dl.id_khoa = k.id_khoa 
        LEFT JOIN bacsi bs ON hsk.id_bacsi = bs.id_bacsi 
        WHERE hsk.id_benhnhan = ?
        ORDER BY hsk.ngay_tao DESC`,
        [patientId]
    );
    
    console.log(`[DB] Tổng số lần khám tìm thấy: ${rows.length}`);
    return rows;
};

// 3. Lấy chi tiết hồ sơ khám bệnh theo ID Hồ sơ (HO_SO_KHAM)
exports.getVisitDetails = async (lichKhamId) => {
    console.log(`[DB] Đang lấy chi tiết Hồ sơ Khám Bệnh cho ID_LK (id_hoso): ${lichKhamId}`);

    // TRUY VẤN: HO_SO_KHAM (hsk) + TOA_THUOC (tt) + CHI_TIET_THUOC (ct)
    const [rows] = await db.execute(
        `SELECT 
            hsk.chuan_doan AS chan_doan, 
            hsk.trieu_chung, 
            hsk.ghi_chu,
            
            -- Lấy thông tin thuốc từ bảng TOA_THUOC và CHI_TIET_THUOC 
            (
                SELECT GROUP_CONCAT(CONCAT(ct.ten_thuoc, ' - ', ct.lieu_luong, ' (', ct.so_ngay, ' ngày)')) 
                FROM toa_thuoc tt
                JOIN chi_tiet_thuoc ct ON tt.id_toa = ct.id_toa
                WHERE tt.id_hoso = hsk.id_hoso
            ) AS thuoc_ke_don
        FROM ho_so_kham hsk
        WHERE hsk.id_hoso = ?`,
        [lichKhamId]
    );

    console.log(`[DB] Đã lấy chi tiết hồ sơ thành công.`);
    return rows[0]; 
};