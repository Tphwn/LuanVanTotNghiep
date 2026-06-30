const express = require('express');
const { createUpload } = require('../../config/multer');
const { MulterError } = require('multer');
const auth = require('../../middlewares/auth.middleware');
const roomTypeController = require('./roomType.controller');

const router = express.Router();
const upload = createUpload({ filePrefix: 'room-' });
const MAX_ROOM_IMAGES = 30;

const handleUpload = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'images') {
        return res.status(400).json({
          success: false,
          message: `Chỉ được tải tối đa ${MAX_ROOM_IMAGES} ảnh mỗi loại phòng`,
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: `Chỉ được tải tối đa ${MAX_ROOM_IMAGES} ảnh mỗi loại phòng`,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Lỗi tải file',
      });
    }

    return next(err);
  });
};

router.get('/amenities', roomTypeController.getAmenitiesForRoom);
router.get('/', auth, roomTypeController.getMyRooms);
router.post('/', auth, handleUpload(upload.any()), roomTypeController.createRoomType);
router.patch('/:id/toggle-status', auth, roomTypeController.toggleRoomStatus);
router.put('/:id', auth, handleUpload(upload.any()), roomTypeController.updateRoomType);

module.exports = router;
