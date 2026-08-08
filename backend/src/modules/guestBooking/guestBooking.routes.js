const express = require('express');
const guestBookingController = require('./guestBooking.controller');

const router = express.Router();

router.post('/', guestBookingController.createBooking);
router.get('/pay/:id', guestBookingController.getBookingForPay);
router.patch('/pay/:id/pay', guestBookingController.confirmPayment);
router.post('/pay/:id/pay/vnpay', guestBookingController.createVnpayPayment);
router.patch('/pay/:id/apply-promo', guestBookingController.applyPromo);
router.patch('/pay/:id/remove-promo', guestBookingController.removePromo);
router.get('/pay/:id/eligible-promotions', guestBookingController.listEligiblePromotions);

router.post('/lookup', guestBookingController.requestLookupOtp);
router.post('/lookup/verify-otp', guestBookingController.verifyLookupOtp);
router.get('/lookup/booking', guestBookingController.getLookupBooking);
router.get('/lookup/cancel-preview', guestBookingController.getCancelPreview);
router.patch('/lookup/cancel', guestBookingController.cancelBooking);

module.exports = router;
