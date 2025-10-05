const bcrypt = require("bcrypt");
const { findUserByUsername } = require("../models/auth.model");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ username và password" });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Sai tên đăng nhập hoặc mật khẩu!" });
    }

    // ❌ Nếu tài khoản bị khóa/inactive
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ error: "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên!" });
    }

    // So sánh mật khẩu
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Sai tên đăng nhập hoặc mật khẩu!" });
    }

    // ✅ Trả JSON về cho frontend xử lý
    return res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status
    });

  } catch (error) {
    console.error("Lỗi login:", error);
    res.status(500).json({ error: "Có lỗi xảy ra, vui lòng thử lại!" });
  }
};
