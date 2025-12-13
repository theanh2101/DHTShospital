const db = require('../../config/db'); 

exports.fetchPatientCounts = async (startDate, endDate, id_khoa) => {
    try {
        const params = [];
        let khoaCondition = '';

        if (id_khoa && id_khoa !== 'all') {
            khoaCondition = `AND L.id_khoa = ?`; 
            params.push(id_khoa);
        }

        // --- BƯỚC QUAN TRỌNG: TÍNH NGÀY TIẾP THEO (nextDay) ---
        // Đảm bảo truy vấn lấy TẤT CẢ các bản ghi trong ngày endDate
        const nextDay = new Date(endDate);
        // Thêm 1 ngày
        nextDay.setDate(nextDay.getDate() + 1); 
        // Format thành chuỗi YYYY-MM-DD
        const nextDayStr = nextDay.toISOString().split('T')[0];

        // Thêm startDate và nextDayStr vào đầu params
        params.unshift(startDate, nextDayStr); 

        // --- CÂU TRUY VẤN SQL ĐÃ ĐƯỢC TỐI ƯU HÓA ---
        const query = `
SELECT
    -- Sử dụng DATE_FORMAT để tránh lỗi Timezone khi NodeJS parse Date object
    DATE_FORMAT(L.ngay, '%Y-%m-%d') AS date, 
    COUNT(L.id_datlich) AS count
FROM
    dat_lich_letan L
WHERE
    -- Lấy từ 00:00:00 của startDate
    L.ngay >= ? 
    -- Lấy đến 23:59:59 của endDate (tức là < 00:00:00 của ngày kế tiếp)
    AND L.ngay < ?  
    ${khoaCondition}
GROUP BY
    date
ORDER BY
    date;
        `.trim();

        console.log("[SQL Query]:", query);
        console.log("[SQL Params]:", params); 

        // ⚠️ THAY THẾ 'db.query' bằng hàm thực thi CSDL của bạn
        const [rows] = await db.query(query, params); 
        
        // Trả về dữ liệu đã được format chuẩn YYYY-MM-DD từ CSDL
        return rows; 

    } catch (error) {
        console.error("LỖI CSDL (thongke.model.js):", error);
        // Quan trọng: Ném lỗi để Controller bắt được
        throw new Error(`Lỗi truy vấn thống kê: ${error.message}`);
    }
};