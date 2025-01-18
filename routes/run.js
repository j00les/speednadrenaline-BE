const express = require('express');
const router = express.Router();

const { Run } = require('../controllers');

router.post('/', Run.saveRun);
router.get('/', Run.getRuns);

module.exports = router;
