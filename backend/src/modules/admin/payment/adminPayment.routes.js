const express = require('express');
const router = express.Router();
const ctrl = require('./adminPayment.controller');

router.get('/stats', ctrl.getStats);
router.get('/transactions', ctrl.getTransactions);
router.get('/transactions/:id', ctrl.getTransactionById);
router.get('/refunds', ctrl.getRefunds);
router.get('/refunds/:id', ctrl.getRefundById);
router.patch('/refunds/:id/approve', ctrl.approveRefund);
router.patch('/refunds/:id/reject', ctrl.rejectRefund);
router.get('/commissions', ctrl.getCommissions);
router.get('/commissions/stats', ctrl.getCommissionStats);
router.get('/commissions/by-partner', ctrl.getCommissionByPartner);
router.get('/commissions/:id', ctrl.getCommissionById);
router.patch('/commissions/:id/confirm', ctrl.confirmCommission);
router.patch('/commissions/:id/hold', ctrl.holdCommission);
router.patch('/commissions/:id/release-hold', ctrl.releaseCommissionHold);
router.get('/partner-payments', ctrl.getPartnerPayments);
router.get('/partner-payments/stats', ctrl.getPartnerPayoutStats);
router.get('/partner-payments/:maDoiTac', ctrl.getPartnerPayoutById);
router.patch('/partner-payments/:maDoiTac/confirm', ctrl.confirmPartnerPayout);
router.patch('/partner-payments/:maDoiTac/release-hold', ctrl.releasePartnerPayoutHold);

module.exports = router;
