const express = require('express');
const authMiddleware = require('../../middlewares/auth.middleware');
const ctrl = require('./customerBooking.controller');

const router = express.Router();

router.get('/', authMiddleware, ctrl.getMyBookings);
router.post('/', authMiddleware, ctrl.createBooking);
router.post('/:id/review', authMiddleware, ctrl.createReview);

module.exports = router;
