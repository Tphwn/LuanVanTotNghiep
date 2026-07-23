const express = require('express');
const router = express.Router();
const ctrl = require('./analytics.controller');

router.get('/dashboard', ctrl.getHomeDashboard);
router.get('/overview', ctrl.getOverview);
router.get('/finance', ctrl.getFinance);
router.get('/business', ctrl.getBusiness);
router.get('/system', ctrl.getSystem);

module.exports = router;
