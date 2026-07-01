const express = require('express');
const ctrl = require('./publicHotel.controller');

const router = express.Router();

router.get('/locations', ctrl.getLocations);
router.get('/destinations/popular', ctrl.getPopularDestinations);
router.get('/amenities', ctrl.getAmenityFilters);
router.get('/hotels/search', ctrl.searchHotels);
router.get('/hotels', ctrl.listHotels);
router.get('/hotels/:hotelId/rooms/:roomId', ctrl.getRoomById);
router.get('/hotels/:id', ctrl.getHotelById);
router.get('/hotels/:hotelId/rooms/:roomId', ctrl.getRoomById);
module.exports = router;
