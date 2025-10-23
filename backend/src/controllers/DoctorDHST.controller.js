const db = require("../models/bacsi.model");

exports.getAllBacSi = (req, res) => {
  db.query("SELECT * FROM bacsi", (err, results) => {
    if (err) {
      console.error("❌ Lỗi truy vấn:", err);
      res.status(500).json({ message: "Lỗi server!" });
    } else {
      res.json(results);
    }
  });
};
