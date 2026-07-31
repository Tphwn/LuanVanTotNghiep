const express = require('express');
const router = express.Router();
const ctrl = require('./adminNotification.controller');

router.get('/', ctrl.getNotifications);
router.patch('/read-all', ctrl.markAllRead);
router.patch('/:id/amenity-added', ctrl.markAmenityProposalAdded);
router.patch('/:id/read', ctrl.markRead);

module.exports = router;
