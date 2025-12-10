// backend/src/services/changePassword.service.js
const pool = require("../../config/db");
const bcrypt = require("bcrypt");

const ChangeService = {
  /**
   * payload: { id_taikhoan, oldPassword, newPassword }
   */
  async changePassword({ id_taikhoan, oldPassword, newPassword }) {
    if (!id_taikhoan || !oldPassword || !newPassword) {
      throw new Error("Thiếu tham số thay đổi mật khẩu");
    }

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        "SELECT password FROM taikhoan WHERE id_taikhoan = ? LIMIT 1",
        [id_taikhoan]
      );
      if (rows.length === 0) throw new Error("Không tìm thấy tài khoản");

      const hashed = rows[0].password;
      const match = await bcrypt.compare(oldPassword, hashed);
      if (!match) throw new Error("Mật khẩu cũ không đúng");

      const newHashed = await bcrypt.hash(newPassword, 10);
      await conn.query("UPDATE taikhoan SET password = ? WHERE id_taikhoan = ?", [
        newHashed,
        id_taikhoan,
      ]);

      return "Đổi mật khẩu thành công";
    } finally {
      conn.release();
    }
  },
};

module.exports = ChangeService;
