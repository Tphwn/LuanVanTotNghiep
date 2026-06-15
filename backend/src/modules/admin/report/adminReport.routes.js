const express = require('express');
const router = express.Router();
const ctrl = require('./adminReport.controller');

router.get('/dashboard', ctrl.getDashboard);
router.get('/', ctrl.getReports);
router.patch('/:id/accept', ctrl.acceptReport);
router.patch('/:id/reject', ctrl.rejectReport);
router.get('/:id', ctrl.getReportById);

module.exports = router;
