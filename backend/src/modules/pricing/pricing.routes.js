const express = require('express');
const router = express.Router();
const ctrl = require('./pricing.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/hotels',   authMiddleware, ctrl.getMyHotels);
router.get('/calendar', authMiddleware, ctrl.getCalendar);
router.post('/save',    authMiddleware, ctrl.savePrices);
router.delete('/delete', authMiddleware, ctrl.deletePrice);

module.exports = router;