const express = require('express');
const router = express.Router();
const ctrl = require('./partnerReview.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/hotels', authMiddleware, ctrl.getHotels);
router.get('/room-types', authMiddleware, ctrl.getRoomTypes);
router.get('/', authMiddleware, ctrl.getReviews);
router.put('/:id/respond', authMiddleware, ctrl.respond);

module.exports = router;
