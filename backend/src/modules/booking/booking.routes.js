const express = require('express');
const router = express.Router();
const ctrl = require('./booking.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/',           authMiddleware, ctrl.getByPartner);
router.get('/:id',        authMiddleware, ctrl.getDetail);
router.patch('/:id/confirm', authMiddleware, ctrl.confirm);
router.patch('/:id/reject',  authMiddleware, ctrl.reject);

module.exports = router;