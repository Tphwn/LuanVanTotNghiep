const express = require('express');
const router = express.Router();
const ctrl = require('./partnerPromotion.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/hotels', authMiddleware, ctrl.getHotels);
router.get('/', authMiddleware, ctrl.list);
router.post('/', authMiddleware, ctrl.create);
router.put('/:id', authMiddleware, ctrl.update);

module.exports = router;
