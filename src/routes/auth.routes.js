import { Router } from "express";
import {
  sendOtpToContact,
  registerProperty,
  registerCleaner,
  loginProperty,
  loginCleaner,
  verifyPropertyContact,
  verifyCleanerContact,
  sendOtptoMail,
  registerAdmin,
  verifyEmail,
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

// property-routes
router.route("/register/property").post(upload.none(), registerProperty);
router.route("/verify-otp/property").post(verifyPropertyContact);
router.route("/login/property").post(loginProperty);
router.route("/logout/property").post(verifyProperty, logoutProperty);

// cleaner-routes
router.route("/register/cleaner").post(
  upload.single("idImage"), // Use upload.single middleware for single file uploads with the field name "idImage"
  (req, res, next) => {
    next();
  },
  registerCleaner
);
router.route("/verify-otp/cleaner").post(verifyCleanerContact);
router.route("/login/cleaner").post(loginCleaner);
router.route("/logout/cleaner").post(verifyCleaner, logoutCleaner);

// admin-routes
router.route("/mail-otp/admin").post(sendOtptoMail);
router.route("/register/admin").post(registerAdmin);
router.route("/verify-email").post(verifyEmail);
router.route("/login/admin").post(loginAdmin);
router.route("/logout/admin").post(verifyAdmin, logoutAdmin);

export default router;
