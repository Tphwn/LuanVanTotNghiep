const express = require('express');
const router = express.Router();
const controller = require('./hotel.controller');

router.get('/', controller.getHotels);
router.get('/:id', controller.getById);
router.patch('/:id/approve', controller.approveHotel);
router.patch('/:id/reject', controller.rejectHotel);
router.patch('/:id/lock', controller.lockHotel);
router.patch('/:id/unlock', controller.unlockHotel);

module.exports = router;
