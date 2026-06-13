const express = require('express');
const router = express.Router();
const ctrl = require('./finance.controller');


router.get('/overview', ctrl.getOverview);
router.get('/commissions', ctrl.getCommissions);
router.get('/reconciliations', ctrl.getReconciliations);
router.post('/reconciliations/calculate', ctrl.calculateReconciliation);

module.exports = router;