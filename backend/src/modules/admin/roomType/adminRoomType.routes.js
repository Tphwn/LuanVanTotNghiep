const express = require('express');
const router = express.Router();
const ctrl = require('./adminRoomType.controller');

router.get('/', ctrl.getRoomTypes);
router.patch('/:id/hide', ctrl.hideRoomType);
router.patch('/:id/show', ctrl.showRoomType);
router.get('/:id', ctrl.getRoomTypeById);

module.exports = router;
