const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Đăng nhập
router.post("/login", authController.login);

// Kiểm tra token hợp lệ
router.get("/check", authController.verifyToken, (req, res) => {
  res.json({ message: "Token hợp lệ!", user: req.user });
});

module.exports = router;
