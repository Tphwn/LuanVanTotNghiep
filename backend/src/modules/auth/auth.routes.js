const router = require('express').Router();
const ctrl = require('./auth.controller');
const { protect } = require('../../middlewares/auth.middleware');
const {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  emailOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validate,
} = require('./auth.validation');

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/verify-register-otp', validate(emailOtpSchema), ctrl.verifyRegisterOtp);
router.post('/resend-otp', validate(resendOtpSchema), ctrl.resendOtp);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/google', validate(googleLoginSchema), ctrl.loginWithGoogle);
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/verify-reset-otp', validate(emailOtpSchema), ctrl.verifyResetOtp);
router.post('/reset-password', validate(resetPasswordSchema), ctrl.resetPassword);
router.get('/me', protect, ctrl.getMe);

module.exports = router;
