const express = require("express");
const { register, login, getMe, forgotPassword, resetPassword, verifyEmail, resendVerification, verifyPhone, sendPhoneVerificationCode } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  registerValidation,
  mobileVerificationValidation,
  resendVerificationValidation,
  loginValidation,
  resetPasswordValidation,
  forgetPasswordValidation,
  verifyPhoneValidation,
} = require("../validations/registerValidation");
const router = express.Router();
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/me", protect, getMe);
router.post("/forgotpassword", forgetPasswordValidation, forgotPassword);
router.put("/resetpassword/:resettoken", resetPasswordValidation, resetPassword);
router.get("/verify-email/:verificationToken", verifyEmail);
router.post("/verify-phone-token", verifyPhoneValidation, verifyPhone);
router.post("/resend-verification", resendVerificationValidation, resendVerification);
router.put("/send-mobile-verifcation", mobileVerificationValidation, sendPhoneVerificationCode);
module.exports = router;
