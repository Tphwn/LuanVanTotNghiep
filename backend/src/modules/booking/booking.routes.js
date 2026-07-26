const express = require('express');
const router = express.Router();
const ctrl = require('./booking.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/',           authMiddleware, ctrl.getByPartner);
router.get('/:id',        authMiddleware, ctrl.getDetail);
router.patch('/:id/check-in', authMiddleware, ctrl.checkIn);
router.patch('/:id/check-out', authMiddleware, ctrl.checkOut);

module.exports = router;