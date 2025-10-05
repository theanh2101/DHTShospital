const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const userRoutes = require("./routes/user.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const khoaRoutes = require("./routes/khoa.routes");

app.use(express.json());
app.use("/api/khoa", khoaRoutes);

// API routes
app.use("/api/users", userRoutes);

const authRoutes = require("./routes/auth.routes");

// ...
app.use("/api/auth", authRoutes);

// Import các routes
const accountRoutes = require('./routes/account.routes');

// Gắn route
app.use('/api/accounts', accountRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
