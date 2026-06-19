const express = require('express');
const router = express.Router();
const ctrl = require('./adminPayment.controller');

router.get('/stats', ctrl.getStats);
router.get('/transactions', ctrl.getTransactions);
router.get('/transactions/:id', ctrl.getTransactionById);
router.get('/refunds', ctrl.getRefunds);
router.patch('/refunds/:id/approve', ctrl.approveRefund);
router.patch('/refunds/:id/reject', ctrl.rejectRefund);
router.get('/commissions', ctrl.getCommissions);
router.get('/commissions/by-partner', ctrl.getCommissionByPartner);
router.patch('/commissions/:id/confirm', ctrl.confirmCommission);
router.get('/partner-payments', ctrl.getPartnerPayments);

module.exports = router;
