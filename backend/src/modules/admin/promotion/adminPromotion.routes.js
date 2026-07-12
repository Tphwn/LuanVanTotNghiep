const express = require('express');
const router = express.Router();
const ctrl = require('./adminPromotion.controller');

router.get('/', ctrl.getPromotions);
router.post('/', ctrl.createPromotion);
router.get('/:id', ctrl.getPromotionById);
router.put('/:id', ctrl.updatePromotion);
router.patch('/:id/lock', ctrl.lockPromotion);
router.patch('/:id/restore', ctrl.restorePromotion);
router.patch('/:id/approve', ctrl.approvePromotion);
router.patch('/:id/reject', ctrl.rejectPromotion);

module.exports = router;
