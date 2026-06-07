const router = require('express').Router();
const controller = require('./hotel.controller');

router.get('/', controller.getAllHotels);
router.get('/:id', controller.getHotelById);
router.patch('/:id/approve', controller.approveHotel);
router.patch('/:id/reject', controller.rejectHotel);
router.patch('/:id/request-info', controller.requestInfo);
router.patch('/:id/lock-toggle', controller.toggleLock);

module.exports = router;