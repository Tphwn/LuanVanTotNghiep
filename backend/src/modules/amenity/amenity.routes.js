const express = require('express');
const router = express.Router();
const controller = require('./amenity.controller');

router.get('/', controller.getAll);
router.get('/partners-for-notify', controller.listPartnersForNotify);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/lock', controller.lock);
router.patch('/:id/unlock', controller.unlock);

module.exports = router;
