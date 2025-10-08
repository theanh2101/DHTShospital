// routes/datlich.routes.js
const express = require('express');
const router = express.Router();
const datlichController = require('../controllers/datlich.controller');

router.post('/', datlichController.createDatLich);

module.exports = router;