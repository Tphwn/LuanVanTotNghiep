const express = require('express');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireActiveUser = require('../../middlewares/activeUser.middleware');
const ctrl = require('./customerBooking.controller');
const { createReviewSchema, validate } = require('./customerReview.validation');
const router = express.Router();

const customerAuth = [authMiddleware, requireActiveUser];

router.get('/', customerAuth, ctrl.getMyBookings);
router.get('/transactions', customerAuth, ctrl.getMyTransactions);
router.get('/refunds', customerAuth, ctrl.getMyRefunds);
router.get('/refunds/:id', customerAuth, ctrl.getMyRefundById);
router.get('/:id/review', customerAuth, ctrl.getReviewByBookingId);
router.get('/:id/eligible-promotions', customerAuth, ctrl.listEligiblePromotions);
router.get('/:id/cancel-preview', customerAuth, ctrl.getCancelPreview);
router.get('/:id', customerAuth, ctrl.getBookingById);
router.post('/', customerAuth, ctrl.createBooking);
router.patch('/:id/pay', customerAuth, ctrl.confirmPayment);
router.post('/:id/pay/vnpay', customerAuth, require('./customerPayment.controller').createVnpayPayment);
router.patch('/:id/apply-promo', customerAuth, ctrl.applyPromo);
router.patch('/:id/remove-promo', customerAuth, ctrl.removePromo);
router.post('/:id/claim-guest', customerAuth, ctrl.claimGuestBooking);
router.patch('/:id/cancel', customerAuth, ctrl.cancelBooking);
router.post('/:id/review', customerAuth, validate(createReviewSchema), ctrl.createReview);

module.exports = router;
