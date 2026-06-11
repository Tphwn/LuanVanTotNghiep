const express = require('express');
const router = express.Router();

const financeController = require('./finance.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get(
  '/summary',
  authMiddleware,
  financeController.getFinanceSummary
);

module.exports = router;