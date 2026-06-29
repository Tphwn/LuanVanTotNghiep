const express = require('express');
const partnerContactController = require('../../partnerContact/partnerContact.controller');

const router = express.Router();

router.get('/', partnerContactController.listRequests);
router.get('/stats', partnerContactController.getStats);
router.get('/:id', partnerContactController.getRequestById);
router.patch('/:id/status', partnerContactController.updateStatus);

module.exports = router;
