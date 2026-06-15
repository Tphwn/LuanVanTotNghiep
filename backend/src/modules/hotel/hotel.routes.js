const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const hotelController = require('./hotel.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const uploadDir = path.join(__dirname, '../../../uploads/');

// TỰ ĐỘNG TẠO THƯ MỤC: Nếu thư mục uploads chưa tồn tại, Node.js sẽ tự động tạo ra nó!
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer để lưu file ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ==========================================
// CÁC ĐƯỜNG DẪN API DÀNH CHO ĐỐI TÁC
// ==========================================

// Lấy danh sách Địa điểm & Tiện nghi (Không cần authMiddleware nếu ai cũng xem được)
router.get('/dia-diem', hotelController.getDiaDiem);
router.get('/amenities', hotelController.getAmenities);

// Lấy danh sách Khách sạn của mình (Bắt buộc phải có authMiddleware để biết user là ai)
router.get('/', authMiddleware, hotelController.getMyHotels);

// Tạo mới Khách sạn (Kèm upload ảnh)
router.post('/', authMiddleware, upload.array('images', 10), hotelController.createHotel);

// Cập nhật Khách sạn (hỗ trợ upload ảnh)
router.put('/:id', authMiddleware, upload.array('images', 10), hotelController.updateHotel);

module.exports = router;