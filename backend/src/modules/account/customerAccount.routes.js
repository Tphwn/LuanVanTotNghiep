const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('./customerAccount.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireActiveUser = require('../../middlewares/activeUser.middleware');

const customerAuth = [authMiddleware, requireActiveUser];

const uploadDir = path.join(__dirname, '../../../uploads/');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh'));
  },
});

router.get('/profile', customerAuth, ctrl.getProfile);
router.put('/profile', customerAuth, upload.single('avatar'), ctrl.updateProfile);
router.put('/password', customerAuth, ctrl.changePassword);
router.put('/phone', customerAuth, ctrl.changePhone);

module.exports = router;
