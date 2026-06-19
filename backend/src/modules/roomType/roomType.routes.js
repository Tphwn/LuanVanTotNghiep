const express = require('express');
const { createUpload } = require('../../config/multer');
const auth = require('../../middlewares/auth.middleware');
const roomTypeController = require('./roomType.controller');

const router = express.Router();
const upload = createUpload({ filePrefix: 'room-' });

router.get('/amenities', roomTypeController.getAmenitiesForRoom);
router.get('/', auth, roomTypeController.getMyRooms);
router.post('/', auth, upload.array('images', 10), roomTypeController.createRoomType);
router.patch('/:id/toggle-status', auth, roomTypeController.toggleRoomStatus);
router.put('/:id', auth, upload.array('images', 10), roomTypeController.updateRoomType);

module.exports = router;
