const express = require('express');
const router = express.Router();

const financeController = require('./finance.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/hotels', authMiddleware, financeController.getHotels);
router.get('/overview', authMiddleware, financeController.getOverview);
router.get('/summary', authMiddleware, financeController.getFinanceSummary);
router.get('/revenue', authMiddleware, financeController.getRevenue);
router.get('/commissions', authMiddleware, financeController.getCommissions);
router.get('/commissions/:id', authMiddleware, financeController.getCommissionById);
router.get('/payouts', authMiddleware, financeController.getPayouts);
router.get('/payout-detail', authMiddleware, financeController.getPayoutDetail);

module.exports = router;
