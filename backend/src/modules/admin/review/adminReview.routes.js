const express = require('express');
const router = express.Router();
const ctrl = require('./adminReview.controller');

router.get('/', ctrl.getReviews);
router.patch('/:id/hide', ctrl.hideReview);
router.patch('/:id/show', ctrl.unhideReview);
router.patch('/:id/hide-partner-response', ctrl.hidePartnerResponse);
router.patch('/:id/show-partner-response', ctrl.unhidePartnerResponse);
router.get('/:id', ctrl.getReviewById);

module.exports = router;
