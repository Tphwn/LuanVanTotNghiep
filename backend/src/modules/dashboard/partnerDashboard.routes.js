const express = require('express');
const router = express.Router();
const ctrl = require('./partnerDashboard.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/', authMiddleware, ctrl.getDashboard);

module.exports = router;
