const express = require('express');
const router = express.Router();
const ctrl = require('./adminReview.controller');

router.get('/', ctrl.getReviews);
router.patch('/:id/hide', ctrl.hideReview);
router.patch('/:id/show', ctrl.showReview);
router.get('/:id', ctrl.getReviewById);

module.exports = router;
