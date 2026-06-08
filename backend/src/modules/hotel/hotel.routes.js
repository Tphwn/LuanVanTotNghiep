const express = require('express');
const router = express.Router();
const ctrl = require('./hotel.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/dia-diem',  ctrl.getDiaDiem);
router.get('/amenities', ctrl.getAmenitiesForHotel);

router.get('/',     authMiddleware, ctrl.getMyHotels);
router.get('/:id',  authMiddleware, ctrl.getById);
router.post('/',    authMiddleware, ctrl.create);
router.put('/:id',  authMiddleware, ctrl.update);

module.exports = router;