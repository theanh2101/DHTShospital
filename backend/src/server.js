// server.js

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

// Import routes
const userRoutes = require("./routes/user.routes");
const khoaRoutes = require("./routes/khoa.routes");
const authRoutes = require("./routes/auth.routes");
const accountRoutes = require("./routes/account.routes");
const newsRoutes = require("./routes/news.routes"); 
const appointmentRoutes = require("./routes/datlich.routes.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 👉 PHỤC VỤ FILE TĨNH (HTML, CSS, JS, ảnh...)
app.use(express.static(path.join(__dirname, "../../frontend/page")));

// 👉 Khi truy cập root (/) thì trả về index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/page/index.html"));
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/khoa", khoaRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/datlich", appointmentRoutes);

// ❗Đặt middleware 404 SAU static và API routes
app.use((req, res) => {
  res.status(404).json({ message: `Không tìm thấy route: ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Lỗi server:", err.stack);
  res.status(500).json({ message: "Đã có lỗi xảy ra trên máy chủ." });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
