import {
  createCleaningRequest,
  getCleaningRequests,
} from "../controllers/cleaningRequest.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyProperty } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyProperty);
router.route("/register/cleaning-request").post(
  upload.single("devicePhoto"), // Use upload.single middleware for single file uploads with the field name "idImage"
  (req, res, next) => {
    next();
  },
  createCleaningRequest
);

router.route("/cleaning-request").get(getCleaningRequests);

export default router;
