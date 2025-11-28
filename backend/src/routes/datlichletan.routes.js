const express = require("express");
const router = express.Router();
const controller = require("../controllers/datlichletan.controller");

router.get("/", controller.getAll);
router.get("/trangthai/:status", controller.getByStatus);
router.get("/:id_datlich", controller.getById);
router.post("/create", controller.create);
router.post("/checkin", controller.checkin);
router.get("/preview/doctor", controller.previewDoctor);
router.get("/doctors/schedule", controller.getDoctorsBySchedule);

module.exports = router;
