// models/bacsi.model.js
const db = require("../../config/db");

let lastAssignedIndexByShift = {};

const getOnDutyDoctors = async (id_khoa, ngay, ca, connection) => {
    const sql = `
        SELECT b.id_bacsi, b.ho_ten, b.chuyen_mon
        FROM lichlamviec lv
        INNER JOIN lichlamviec_bacsi lvb ON lv.id_lichlamviec = lvb.id_lichlamviec
        INNER JOIN bacsi b ON lvb.id_bacsi = b.id_bacsi
        WHERE lv.id_khoa = ? AND lv.ngay = ? AND lv.ca = ?
    `;
    const [onDutyDoctors] = await connection.query(sql, [id_khoa, ngay, ca]);
    return onDutyDoctors;
};

// Hàm này chỉ đọc ra lượt cuối cùng
const getLastAssignedIndex = (shiftKey) => {
    return lastAssignedIndexByShift[shiftKey] ?? -1;
};

// Hàm này chỉ cập nhật lại lượt cuối cùng
const updateLastAssignedIndex = (shiftKey, newIndex) => {
    lastAssignedIndexByShift[shiftKey] = newIndex;
    console.log(`✅ Đã cập nhật lượt cho ca ${shiftKey}, vị trí mới là: ${newIndex}`);
};

module.exports = { getOnDutyDoctors, getLastAssignedIndex, updateLastAssignedIndex };