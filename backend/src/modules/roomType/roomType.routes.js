const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const roomTypeController = require('./roomType.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

// --- BỔ SUNG ĐOẠN NÀY VÀO (TRƯỚC DÒNG ROUTER) ---
const uploadDir = path.join(__dirname, '../../../uploads/');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) { 
    cb(null, 'room-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)); 
  }
});
const upload = multer({ storage: storage });
// ------------------------------------------------

// Giờ thì router.post có thể dùng 'upload' thoải mái
router.get('/amenities', roomTypeController.getAmenitiesForRoom);
router.get('/', authMiddleware, roomTypeController.getMyRooms);
router.post('/', authMiddleware, upload.array('images', 10), roomTypeController.createRoomType);
router.put('/:id', authMiddleware, upload.array('images', 10), roomTypeController.updateRoomType);

module.exports = router;