const express = require('express');
const ctrl = require('./publicHotel.controller');
const promoCtrl = require('./publicPromotion.controller');

const router = express.Router();

router.get('/locations', ctrl.getLocations);
router.get('/destinations/popular', ctrl.getPopularDestinations);
router.get('/destinations/featured', ctrl.getFeaturedByDestination);
router.get('/amenities', ctrl.getAmenityFilters);
router.get('/promotions/system', promoCtrl.getSystemPromotions);
router.get('/promotions/hotel/:hotelId', promoCtrl.getHotelPromotions);
router.get('/hotels/search', ctrl.searchHotels);
router.get('/hotels', ctrl.listHotels);
router.get('/hotels/:hotelId/rooms/:roomId', ctrl.getRoomById);
router.get('/hotels/:id', ctrl.getHotelById);
module.exports = router;
