import { Router } from "express";
import {
  sendOtpToContact,
  registerProperty,
  registerCleaner,
  loginProperty,
  forgotPasswordProperty,
  resetPasswordProperty,
  verifyCleanerEmail,
  loginCleaner,
  forgotPasswordCleaner,
  resetPasswordCleaner,
  verifyPropertyContact,
  verifyCleanerContact,
  sendOtptoMail,
  registerAdmin,
  verifyEmail,
  verifyPropertyEmail,
  loginAdmin,
  logoutAdmin,
  logoutCleaner,
  logoutProperty,
} from "../controllers/auth.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  verifyAdmin,
  verifyCleaner,
  verifyProperty,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/send-otp").post(sendOtpToContact);
router.route("/mail-otp").post(sendOtptoMail);
// property-routes
router.route("/register/property").post(upload.none(), registerProperty);
router.route("/verify-otp/property").post(verifyPropertyContact);
router.route("/login/property").post(loginProperty);
router.route("/verify-email/property").post(verifyPropertyEmail);
router.route("/forgot-password/property").post(forgotPasswordProperty);
router.route("/reset-password/property").post(resetPasswordProperty);
router.route("/logout/property").post(verifyProperty, logoutProperty);

// cleaner-routes
// router.route("/register/cleaner").post(
//   upload.single("idImage"), // Use upload.single middleware for single file uploads with the field name "idImage"
//   (req, res, next) => {
//     next();
//   },
//   registerCleaner
// );

router.route("/register/cleaner").post(upload.none(), registerCleaner); // error in this line
router.route("/verify-otp/cleaner").post(verifyCleanerContact);
router.route("/verify-email/cleaner").post(verifyCleanerEmail);
router.route("/login/cleaner").post(loginCleaner);
router.route("/forgot-password/cleaner").post(forgotPasswordCleaner);
router.route("/reset-password/cleaner").post(resetPasswordCleaner);
router.route("/logout/cleaner").post(verifyCleaner, logoutCleaner);

// admin-routes
router.route("/register/admin").post(registerAdmin);
router.route("/verify-email").post(verifyEmail);
router.route("/login/admin").post(loginAdmin);
router.route("/logout/admin").post(verifyAdmin, logoutAdmin);

export default router;
