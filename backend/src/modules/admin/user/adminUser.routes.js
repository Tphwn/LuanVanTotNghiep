const express = require('express');

const router = express.Router();

const { createUpload } = require('../../../config/multer');
const controller = require('./adminUser.controller');

const upload = createUpload({ filePrefix: 'partner-' });

router.get('/', controller.getUsers);

router.post('/partner', upload.single('avatar'), controller.createPartner);

router.get('/:id', controller.getUserById);

router.patch('/:id/lock', controller.lockUser);

router.patch('/:id/unlock', controller.unlockUser);

module.exports = router;