const express = require('express');
const authMiddleware = require('../../middlewares/auth.middleware');
const ctrl = require('./customerBooking.controller');
const { createReviewSchema, validate } = require('./customerReview.validation');
const router = express.Router();

router.get('/', authMiddleware, ctrl.getMyBookings);
router.get('/:id/review', authMiddleware, ctrl.getReviewByBookingId);
router.get('/:id', authMiddleware, ctrl.getBookingById);
router.post('/', authMiddleware, ctrl.createBooking);
router.patch('/:id/pay', authMiddleware, ctrl.confirmPayment);
router.patch('/:id/apply-promo', authMiddleware, ctrl.applyPromo);
router.get('/:id/cancel-preview', authMiddleware, ctrl.getCancelPreview);
router.patch('/:id/cancel', authMiddleware, ctrl.cancelBooking);
router.post('/:id/review', authMiddleware, validate(createReviewSchema), ctrl.createReview);

module.exports = router;
