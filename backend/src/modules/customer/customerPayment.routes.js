const express = require('express');
const customerPaymentController = require('./customerPayment.controller');

const router = express.Router();

router.get('/vnpay/return', customerPaymentController.vnpayReturn);

module.exports = router;
