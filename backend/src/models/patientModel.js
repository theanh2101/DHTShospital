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
            hsk.id_hoso AS id_lichkham,
            dl.ngay AS ngay_dat,
            dl.gio_hen AS khung_gio,
            k.ten_khoa,
            bs.ho_ten AS ten_bacsi,
            hsk.ngay_tao AS ngay_kham,
            hsk.chuan_doan AS ket_qua,
            hsk.trang_thai
        FROM ho_so_kham hsk
        JOIN dat_lich_letan dl ON hsk.id_datlich = dl.id_datlich   -- FIX ĐÚNG BẢNG
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
    console.log(`[DB] Đang lấy chi tiết Hồ sơ Khám Bệnh cho ID_HOSO: ${lichKhamId}`);

    const [rows] = await db.query(
        `
        SELECT
            hsk.id_hoso,
            hsk.chuan_doan AS chuan_doan,
            hsk.trieu_chung, 
            hsk.ghi_chu,
            hsk.ngay_tao AS ngay_kham, 

            -- Bác sĩ
            bs.ho_ten AS ten_bacsi, 
            k.ten_khoa AS chuyen_khoa, 

            -- Bệnh nhân
            bn.ho_ten AS ho_ten_bn,
            bn.ngay_sinh AS ngay_sinh_bn,
            bn.gioi_tinh AS gioi_tinh_bn,
            bn.phone AS sdt_bn, 
            bn.email AS email_bn,

            -- Lịch khám (LẤY ĐÚNG BẢNG dat_lich_letan)
            dl.ngay AS ngay_dat,
            dl.gio_hen,
            
            -- Đơn thuốc (JSON)
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'ten_thuoc', ct.ten_thuoc,
                        'lieu_luong', ct.lieu_luong,
                        'so_ngay', ct.so_ngay,
                        'cach_dung', ct.cach_dung
                    )
                )
                FROM toa_thuoc tt
                JOIN chi_tiet_thuoc ct ON tt.id_toa = ct.id_toa
                WHERE tt.id_hoso = hsk.id_hoso
            ) AS thuoc_ke_don

        FROM ho_so_kham hsk
        
        JOIN dat_lich_letan dl ON hsk.id_datlich = dl.id_datlich   -- FIX QUAN TRỌNG NHẤT
        LEFT JOIN benhnhan bn ON hsk.id_benhnhan = bn.id_benhnhan 
        LEFT JOIN bacsi bs ON hsk.id_bacsi = bs.id_bacsi
        LEFT JOIN khoa k ON dl.id_khoa = k.id_khoa
        
        WHERE hsk.id_hoso = ?

        GROUP BY hsk.id_hoso
        `,
        [lichKhamId]
    );

    console.log(`[DB] Chi tiết hồ sơ trả về:`, rows[0]);

    return rows[0]; 
};

