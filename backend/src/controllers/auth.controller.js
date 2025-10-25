// controllers/auth.controller.js
require("dotenv").config();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { findUserByUsername } = require("../models/auth.model");

const MY_SECRET_KEY = process.env.JWT_SECRET || "benhvien_dhst_2025";

// 🧠 Đăng nhập
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: "Vui lòng nhập đủ thông tin!" });

    const user = await findUserByUsername(username);
    if (!user) return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu!" });

    if (user.status !== "ACTIVE")
      return res.status(403).json({ error: "Tài khoản đang bị khóa!" });

    if (!user.password)
      return res.status(401).json({ error: "Tài khoản không có mật khẩu hợp lệ!" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu!" });

    // ✅ Tạo token sống 30 ngày
    const token = jwt.sign(
      { id: user.id_taikhoan, username: user.username, role: user.role },
      MY_SECRET_KEY,
      { expiresIn: "30d" }
    );

    res.json({
      message: "Đăng nhập thành công!",
      token,
      user: {
        id: user.id_taikhoan,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Lỗi login:", err);
    res.status(500).json({ error: "Lỗi máy chủ, vui lòng thử lại!" });
  }
};

// 🧱 Middleware xác thực token
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Thiếu token!" });

  jwt.verify(token, MY_SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Token không hợp lệ hoặc hết hạn!" });
    req.user = user;
    next();
  });
};
