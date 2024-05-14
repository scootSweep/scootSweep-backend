import {
  getAllCleaningRequests,
  getCleaningRequestById,
  updateCleaningRequest,
  deleteCleaningRequest,
} from "../controllers/admin.controller.js";
import { registerCleaner } from "../controllers/auth.controller.js";
import { Router } from "express";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyAdmin);

router.route("/register/cleaner").post(
  upload.single("idImage"), // Use upload.single middleware for single file uploads with the field name "idImage"
  (req, res, next) => {
    next();
  },
  registerCleaner
);

router.route("/cleaning_requests").get(getAllCleaningRequests);
router
  .route("/cleaning_requests/:cleaningRequestId")
  .get(getCleaningRequestById)
  .put(updateCleaningRequest)
  .delete(deleteCleaningRequest);

export default router;
