// src/models/patientModel.js
const db = require('../../config/db');

// 1. Tìm bệnh nhân theo SĐT (BENHNHAN)
exports.findPatientsByPhone = async (phoneNumber) => {
    const [rows] = await db.execute(
        `SELECT 
            id_benhnhan, 
            ho_ten, 
            gioi_tinh, 
            ngay_sinh, 
            dia_chi, 
            so_bhyt, 
            phone, 
            email
        FROM benhnhan 
        WHERE TRIM(phone) = ?`,
        [phoneNumber]
    );

    console.log(`[DB] Tìm bệnh nhân theo SĐT "${phoneNumber}" → ${rows.length} kết quả`);
    return rows;
};

// 2. Lấy danh sách lần khám theo ID Bệnh nhân (HO_SO_KHAM)
exports.getVisitsByPatientId = async (patientId) => {
    console.log(`[DB] Lấy lịch sử khám cho bệnh nhân ID: ${patientId}`);

    const [rows] = await db.execute(
        `SELECT 
            hsk.id_hoso AS id_lichkham,       -- ID hồ sơ = ID lần khám
            dl.ngay AS ngay_dat,              -- Ngày đặt lịch
            dl.khung_gio,                     -- Thời gian đặt
            k.ten_khoa,                       -- Khoa khám
            bs.ho_ten AS ten_bacsi,           -- Bác sĩ phụ trách
            hsk.ngay_tao AS ngay_kham,        -- Ngày khám (ngày tạo hồ sơ)
            hsk.chuan_doan AS ket_qua,        -- Kết quả chẩn đoán
            hsk.trang_thai                    -- Trạng thái hồ sơ
        FROM ho_so_kham hsk
        JOIN dat_lich dl ON hsk.id_datlich = dl.id_datlich
        JOIN khoa k ON dl.id_khoa = k.id_khoa
        LEFT JOIN bacsi bs ON hsk.id_bacsi = bs.id_bacsi
        WHERE hsk.id_benhnhan = ?
        ORDER BY hsk.ngay_tao DESC`,
        [patientId]
    );

    console.log(`[DB] Tìm thấy ${rows.length} lần khám`);
    return rows;
};
// 3. Lấy chi tiết hồ sơ khám bệnh theo ID Hồ sơ (HO_SO_KHAM)
exports.getVisitDetails = async (lichKhamId) => {
    console.log(`[DB] Lấy chi tiết hồ sơ khám bệnh (id_hoso): ${lichKhamId}`);

    const [rows] = await db.execute(
        `SELECT 
            hsk.id_hoso,
            bn.ho_ten AS ten_benhnhan,
            bn.gioi_tinh,
            bn.ngay_sinh,
            bn.dia_chi,
            bs.ho_ten AS ten_bacsi,
            k.ten_khoa,
            hsk.trieu_chung,
            hsk.chuan_doan,
            hsk.ghi_chu,
            hsk.ngay_tao AS ngay_kham,
            hsk.trang_thai,
            
            -- Lấy thuốc đã kê trong đơn
            (
                SELECT GROUP_CONCAT(
                    CONCAT(ct.ten_thuoc, ' - ', ct.lieu_luong, ' (', ct.so_ngay, ' ngày, ', ct.cach_dung, ')')
                    SEPARATOR '; '
                )
                FROM toa_thuoc tt
                JOIN chi_tiet_thuoc ct ON tt.id_toa = ct.id_toa
                WHERE tt.id_hoso = hsk.id_hoso
            ) AS thuoc_ke_don

        FROM ho_so_kham hsk
        JOIN benhnhan bn ON hsk.id_benhnhan = bn.id_benhnhan
        LEFT JOIN bacsi bs ON hsk.id_bacsi = bs.id_bacsi
        LEFT JOIN dat_lich dl ON hsk.id_datlich = dl.id_datlich
        LEFT JOIN khoa k ON dl.id_khoa = k.id_khoa
        WHERE hsk.id_hoso = ?`,
        [lichKhamId]
    );

    console.log(`[DB] Hồ sơ ID ${lichKhamId} → Đã lấy thành công.`);
    return rows[0];
};