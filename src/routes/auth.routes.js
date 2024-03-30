import { Router } from "express";
import {
  sendOtpToContact,
  registerProperty,
  registerCleaner,
  loginProperty,
  loginCleaner,
  verifyPropertyContact,
  verifyCleanerContact,
} from "../controllers/auth.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register/property").post(registerProperty);
router.route("/register/cleaner").post(
  upload.single("idImage"), // Use upload.single middleware for single file uploads with the field name "idImage"
  (req, res, next) => {
    next();
  },
  registerCleaner
);

router.route("/send-otp").post(sendOtpToContact);

router.route("/verify-otp/property").post(verifyPropertyContact);
router.route("/verify-otp/cleaner").post(verifyCleanerContact);

router.route("/login/property").post(loginProperty);
router.route("/login/cleaner").post(loginCleaner);

export default router;
