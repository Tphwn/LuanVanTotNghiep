const express = require('express');
const router  = express.Router();
const ctrl    = require('./adminPayment.controller');
const auth    = require('../../../middlewares/auth.middleware');
const admin   = require('../../../middlewares/adminMiddleware');

const g = [auth, admin];

router.get('/stats',                    ...g, ctrl.getStats);
router.get('/transactions',             ...g, ctrl.getTransactions);
router.get('/transactions/:id',         ...g, ctrl.getTransactionById);
router.get('/refunds',                  ...g, ctrl.getRefunds);
router.patch('/refunds/:id/approve',    ...g, ctrl.approveRefund);
router.patch('/refunds/:id/reject',     ...g, ctrl.rejectRefund);
router.get('/commissions',              ...g, ctrl.getCommissions);
router.get('/commissions/by-partner',   ...g, ctrl.getCommissionByPartner);
router.patch('/commissions/:id/confirm',...g, ctrl.confirmCommission);
router.get('/partner-payments',         ...g, ctrl.getPartnerPayments);

module.exports = router;