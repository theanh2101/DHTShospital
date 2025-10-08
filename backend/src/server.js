
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ================== MIDDLEWARE CƠ BẢN ==================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ================== KIỂM TRA & TẠO THƯ MỤC UPLOAD ==================
const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Tạo thư mục upload:", uploadDir);
}

// ================== CHO PHÉP TRUY CẬP FILE ẢNH ==================
// Khi bạn truy cập http://localhost:3000/uploads/news/abc.png
// thì nó sẽ đọc file từ backend/public/uploads/news/abc.png
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));


// ================== IMPORT CÁC ROUTE ==================
const userRoutes = require("./routes/user.routes");
const khoaRoutes = require("./routes/khoa.routes");
const authRoutes = require("./routes/auth.routes");
const accountRoutes = require("./routes/account.routes");
const newsRoutes = require("./routes/news.routes");
const appointmentRoutes = require("./routes/datlich.routes.js");

// 👉 PHỤC VỤ FILE TĨNH (HTML, CSS, JS, ảnh...)
app.use(express.static(path.join(__dirname, "../../frontend/page")));

// 👉 Khi truy cập root (/) thì trả về index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/page/index.html"));
});


// ================== GẮN ROUTE VÀO APP ==================
app.use("/api/users", userRoutes);
app.use("/api/khoa", khoaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/datlich", appointmentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Không tìm thấy route: ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Lỗi server:", err.stack);
  res.status(500).json({ message: "Đã có lỗi xảy ra trên máy chủ." });
});


// ================== KHỞI ĐỘNG SERVER ==================
app.listen(PORT, () => {
  console.log("🚀 Server chạy tại: http://localhost:" + PORT);
  console.log("🖼️  Ảnh upload tại: http://localhost:" + PORT + "/uploads/");
});


