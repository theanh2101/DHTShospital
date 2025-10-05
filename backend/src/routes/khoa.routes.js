// routes/khoa.routes.js
const express = require("express");
const router = express.Router();
const khoaController = require("../controllers/khoa.controller");

// GET /api/khoa
router.get("/", khoaController.getAllKhoa);

module.exports = router;
