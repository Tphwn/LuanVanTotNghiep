const express = require('express');
const router = express.Router();
const ctrl = require('./pricing.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/hotels',   authMiddleware, ctrl.getMyHotels);
router.get('/management-calendar', authMiddleware, ctrl.getManagementCalendar);
router.get('/calendar', authMiddleware, ctrl.getCalendar);
router.post('/save',    authMiddleware, ctrl.savePrices);
router.post('/restore', authMiddleware, ctrl.restoreBasePrices);
router.delete('/delete', authMiddleware, ctrl.deletePrice);
router.post('/delete-bulk', authMiddleware, ctrl.deletePricesBulk);

module.exports = router;