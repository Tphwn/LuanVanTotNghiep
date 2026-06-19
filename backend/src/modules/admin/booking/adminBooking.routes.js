const express = require('express');
const router = express.Router();
const ctrl = require('./adminBooking.controller');

router.get('/stats', ctrl.getStats);
router.get('/hotels', ctrl.getAllHotels);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.patch('/:id/cancel', ctrl.cancelBooking);

module.exports = router;
