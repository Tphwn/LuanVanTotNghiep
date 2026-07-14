const express = require('express');
const { createUpload } = require('../../config/multer');
const auth = require('../../middlewares/auth.middleware');
const hotelController = require('./hotel.controller');

const router = express.Router();
const upload = createUpload();

router.get('/dia-diem', hotelController.getDiaDiem);
router.get('/amenities', hotelController.getAmenities);
router.get('/', auth, hotelController.getMyHotels);
router.post('/', auth, upload.array('images', 30), hotelController.createHotel);
router.put('/:id', auth, upload.array('images', 30), hotelController.updateHotel);
router.delete('/:id', auth, hotelController.deleteHotel);

module.exports = router;
