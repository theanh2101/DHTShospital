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

//2. Lấy lịch sử khám

exports.getVisitsByPatientId = async (patientId) => {
    console.log(`[Model TraCuu] Đang lấy lịch sử cho BN: ${patientId}`);

    let sql = `
        SELECT 
            hsk.id_hoso AS id_lichkham,
            dl.id_datlich,
            
            -- 1. LẤY NGÀY KHÁM (Logic giống bên Bác sĩ)
            COALESCE(dl.ngay, hsk.ngay_tao) AS ngay_kham,
            
            -- 2. LẤY TÊN KHOA
            -- Ưu tiên khoa của Bác sĩ (chính xác nhất), nếu không thì lấy khoa trong lịch đặt
            COALESCE(k_bs.ten_khoa, k_dl.ten_khoa, 'Khoa Khám Bệnh') AS ten_khoa,
            
            -- 3. LẤY TÊN BÁC SĨ (Quan trọng: Đổi ho_ten thành ten_bacsi)
            -- Ưu tiên BS trong hồ sơ, nếu không thì lấy BS trong lịch, cuối cùng là 'Chưa cập nhật'
            COALESCE(bs.ho_ten, bs_dl.ho_ten, 'Chưa cập nhật') AS ten_bacsi,
            
            -- Lấy kết quả
            hsk.chuan_doan AS ket_qua,
            hsk.chuan_doan, -- Lấy thêm trường gốc để dự phòng
            hsk.trang_thai
            
        FROM ho_so_kham hsk
        LEFT JOIN dat_lich_letan dl ON hsk.id_datlich = dl.id_datlich
        
        -- JOIN 1: Lấy Bác sĩ chính thức trong hồ sơ (bảng ho_so_kham)
        LEFT JOIN bacsi bs ON hsk.id_bacsi = bs.id_bacsi
        LEFT JOIN khoa k_bs ON bs.id_khoa = k_bs.id_khoa
        
        -- JOIN 2: Lấy Bác sĩ dự kiến trong lịch (bảng dat_lich_letan) - phòng trường hợp hồ sơ chưa lưu ID bác sĩ
        LEFT JOIN bacsi bs_dl ON dl.id_bacsi = bs_dl.id_bacsi
        LEFT JOIN khoa k_dl ON dl.id_khoa = k_dl.id_khoa
        
        WHERE hsk.id_benhnhan = ?
        ORDER BY hsk.ngay_tao DESC
    `;

    try {
        const [rows] = await db.execute(sql, [patientId]);
        console.log("👉 KẾT QUẢ SQL TRẢ VỀ:", JSON.stringify(rows, null, 2));
        return rows;
    } catch (err) {
        console.error("🔥 Lỗi SQL Tra Cứu:", err);
        return [];
    }
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
        
        JOIN dat_lich_letan dl ON hsk.id_datlich = dl.id_datlich 
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