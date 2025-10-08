const {
  createUser,
  createDoctor,
  createReceptionist,
} = require("../models/user.model");
const { generatePassword, hashPassword } = require("../services/password.service");

// 🔹 Controller tạo tài khoản
async function createAccount(req, res) {
  try {
    const { username, role, status = "ACTIVE", hoten, id_khoa, phone, email } = req.body;

    console.log("📥 Dữ liệu nhận được:", req.body);

    // Kiểm tra dữ liệu bắt buộc
    if (!username || !role || !hoten) {
      return res.status(400).json({
        error: "Thiếu dữ liệu bắt buộc (họ tên, username, vai trò)",
      });
    }

    // 1️⃣ Tạo mật khẩu ngẫu nhiên
    const plainPassword = generatePassword();

    // 2️⃣ Hash mật khẩu bằng bcrypt
    const hashedPassword = await hashPassword(plainPassword);

    // 3️⃣ Tạo tài khoản trong bảng TAIKHOAN
    const id_taikhoan = await createUser(username, hashedPassword, role, status);

    // 4️⃣ Tạo thông tin cá nhân trong bảng tương ứng
    if (role === "BACSI") {
      await createDoctor(id_taikhoan, hoten, id_khoa, phone, email);
    } else if (role === "LETAN") {
      await createReceptionist(id_taikhoan, hoten, phone, email);
    } else {
      return res.status(400).json({ error: "Vai trò không hợp lệ." });
    }

    // 5️⃣ Phản hồi lại client
    res.status(201).json({
      message: "Tạo tài khoản thành công!",
      account: {
        username,
        password: plainPassword,
        role,
        status,
        hoten,
        id_taikhoan, // ✅ trả về ID tài khoản luôn
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi tạo tài khoản:", err);
    res.status(500).json({ error: "Lỗi server khi tạo tài khoản." });
  }
}

module.exports = { createAccount };
