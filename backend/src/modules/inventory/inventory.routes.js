const express = require('express');
const router = express.Router();
const ctrl = require('./inventory.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/hotels', authMiddleware, ctrl.getHotels);
router.get('/', authMiddleware, ctrl.getInventory);
router.put('/:id/open-sale', authMiddleware, ctrl.updateOpenSale);
router.put('/:id/close-sale', authMiddleware, ctrl.closeSale);
router.put('/:id/reopen-sale', authMiddleware, ctrl.reopenSale);

module.exports = router;
