const router = require('express').Router();
const ctrl = require('./auth.controller');
const { protect } = require('./auth.middleware');
const { registerSchema, loginSchema, validate } = require('./auth.validation');

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login',    validate(loginSchema),    ctrl.login);
router.get('/me',        protect,                  ctrl.getMe);

module.exports = router;