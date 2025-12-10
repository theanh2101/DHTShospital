const express = require("express");
const router = express.Router();
const changeController = require("../controllers/changePassword.controller");

router.post("/", changeController.changePassword);

module.exports = router;
