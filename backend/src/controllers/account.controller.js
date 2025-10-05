// backend/src/controllers/account.controller.js
const Account = require("../models/account.model");

exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.getAllAccounts();
    res.status(200).json(accounts);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách tài khoản:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// 📌 Thay đổi trạng thái tài khoản (Khóa / Mở khóa)
exports.updateAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;          // id_taikhoan
    const { status } = req.body;        // ACTIVE / INACTIVE

    if (!id || !status) {
      return res.status(400).json({ message: "Thiếu dữ liệu!" });
    }

    await Account.updateAccountStatus(id, status);

    res.status(200).json({ 
      message: `Cập nhật trạng thái tài khoản #${id} thành công!`,
      status 
    });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật trạng thái:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};
