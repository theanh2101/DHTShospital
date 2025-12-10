// backend/src/controllers/changePassword.controller.js
const ChangeService = require("../services/changePassword.service");

exports.changePassword = async (req, res, next) => {
  try {
    const { id_taikhoan, oldPassword, newPassword } = req.body;
    const result = await ChangeService.changePassword({ id_taikhoan, oldPassword, newPassword });
    res.json({ success: true, message: result });
  } catch (err) {
    // trả lỗi rõ ràng cho frontend
    res.status(400).json({ success: false, message: err.message || "Lỗi đổi mật khẩu" });
  }
};
