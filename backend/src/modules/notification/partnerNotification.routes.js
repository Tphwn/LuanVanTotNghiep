const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const ctrl = require('./partnerNotification.controller');

router.get('/amenity-requests', authMiddleware, ctrl.getMyAmenityRequests);
router.get('/', authMiddleware, ctrl.getNotifications);
router.patch('/read-all', authMiddleware, ctrl.markAllRead);
router.patch('/:id/read', authMiddleware, ctrl.markRead);

module.exports = router;
