const express = require('express');

const router = express.Router();

const controller =
require('./adminUser.controller');

router.get('/', controller.getUsers);

router.get('/:id', controller.getUserById);

router.patch('/:id/lock', controller.lockUser);

router.patch('/:id/unlock', controller.unlockUser);

router.post('/partner', controller.createPartner);

module.exports = router;