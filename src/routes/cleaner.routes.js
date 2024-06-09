import { Router } from "express";
import { verifyCleaner } from "../middlewares/auth.middleware.js";
import cleanerService from "../services/cleaner.service.js";
// import { createCleaningInvoice } from "../controllers/cleaningInvoice.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/property-location").get(cleanerService.getAllPropertyLocation);

router.use(verifyCleaner);
// router.route("/cleaning-invoice").post(upload.none(), createCleaningInvoice);
router
  .route("/cleaning-invoice")
  .post(upload.none(), cleanerService.createCleaningInvoice);

// send otp to open the door
router.route("/door-otp").post(cleanerService.doorOtp);
router.route("/verify-door").post(cleanerService.verifyDoorOtp);

router
  .route("/redeployment")
  .post(upload.single("deviceIDImage"), cleanerService.createRedeployment);

export default router;
