const express = require('express');
const router = express.Router();
const ctrl = require('./finance.controller');


router.get('/overview', ctrl.getOverview);
router.get('/commissions', ctrl.getCommissions);

module.exports = router;