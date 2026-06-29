const express = require('express');
const partnerContactController = require('./partnerContact.controller');

const router = express.Router();

router.post('/', partnerContactController.createRequest);

module.exports = router;
