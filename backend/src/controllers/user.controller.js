const { createUser, createDoctor, createReceptionist } = require("../models/user.model");
const { generatePassword, hashPassword } = require("../services/password.service");

async function createAccount(req, res) {
  const { username, role, status, hoten, id_khoa } = req.body;
  console.log("req.body:", req.body);


  if (!username || !role || !hoten) {
    return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc" });
  }

  try {
    const plainPassword = generatePassword();
    const hashedPassword = await hashPassword(plainPassword);

    const id_taikhoan = await createUser(username, hashedPassword, role, status);

    if (role === "BACSI") {
      await createDoctor(id_taikhoan, hoten, id_khoa);
    } else if (role === "LETAN") {
      await createReceptionist(id_taikhoan, hoten);
    }

    res.json({
      message: "Tạo tài khoản thành công",
      username,
      password: plainPassword,
      role,
      hoten,
    });
  } catch (err) {
    console.error("Lỗi tạo tài khoản:", err);
    res.status(500).json({ error: "Lỗi server khi tạo tài khoản" });
  }
}

module.exports = { createAccount };
