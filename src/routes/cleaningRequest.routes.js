import { createCleaningRequest } from "../controllers/cleaningRequest.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register/cleaner").post(
  upload.single("idImage"), // Use upload.single middleware for single file uploads with the field name "idImage"
  (req, res, next) => {
    next();
  },
  registerCleaner
);
