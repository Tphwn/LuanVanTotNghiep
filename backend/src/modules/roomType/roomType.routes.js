const express = require('express');
const router = express.Router();
const ctrl = require('./roomType.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const controller = require('./roomType.controller');
const upload =require('../../middlewares/upload.middleware');
router.get('/', authMiddleware, ctrl.getRooms);
router.post('/', authMiddleware, ctrl.create);
router.put('/:id', authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.delete);

module.exports = router;
