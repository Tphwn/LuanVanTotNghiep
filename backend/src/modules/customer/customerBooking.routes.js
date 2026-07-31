const express = require('express');
const authMiddleware = require('../../middlewares/auth.middleware');
const ctrl = require('./customerBooking.controller');
const { createReviewSchema, validate } = require('./customerReview.validation');
const router = express.Router();

router.get('/', authMiddleware, ctrl.getMyBookings);
router.get('/transactions', authMiddleware, ctrl.getMyTransactions);
router.get('/refunds', authMiddleware, ctrl.getMyRefunds);
router.get('/refunds/:id', authMiddleware, ctrl.getMyRefundById);
router.get('/:id/review', authMiddleware, ctrl.getReviewByBookingId);
router.get('/:id', authMiddleware, ctrl.getBookingById);
router.post('/', authMiddleware, ctrl.createBooking);
router.patch('/:id/pay', authMiddleware, ctrl.confirmPayment);
router.post('/:id/pay/vnpay', authMiddleware, require('./customerPayment.controller').createVnpayPayment);
router.patch('/:id/apply-promo', authMiddleware, ctrl.applyPromo);
router.get('/:id/cancel-preview', authMiddleware, ctrl.getCancelPreview);
router.patch('/:id/cancel', authMiddleware, ctrl.cancelBooking);
router.post('/:id/review', authMiddleware, validate(createReviewSchema), ctrl.createReview);

module.exports = router;
