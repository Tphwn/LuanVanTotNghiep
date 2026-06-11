const express = require('express');
const router = express.Router();
const ctrl = require('./adminBooking.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const adminMiddleware = require('../../../middlewares/adminMiddleware');

const guard = [authMiddleware, adminMiddleware];

router.get('/stats',          ...guard, ctrl.getStats);
router.get('/hotels',         ...guard, ctrl.getAllHotels);
router.get('/',               ...guard, ctrl.getAll);
router.get('/:id',            ...guard, ctrl.getById);
router.patch('/:id/cancel',   ...guard, ctrl.cancelBooking);

module.exports = router;