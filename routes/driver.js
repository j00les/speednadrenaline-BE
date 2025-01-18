const express = require('express');
const { Driver } = require('../controllers');
const router = express.Router();

router.get('/drivers', Driver.getRuns);

module.exports = router;
