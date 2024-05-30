import {
  getAllCleaningRequests,
  getCleaningRequestById,
  updateCleaningRequest,
  deleteCleaningRequest,
  getAllProperty,
  getPropertyById,
  getAllCleaner,
  getCleanerById,
} from "../controllers/admin.controller.js";
import { registerCleaner } from "../controllers/auth.controller.js";
import { Router } from "express";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyAdmin);

router.route("/register/cleaner").post(upload.none(), registerCleaner);

router.route("/cleaning_requests").get(getAllCleaningRequests);
router
  .route("/cleaning_requests/:cleaningRequestId")
  .get(getCleaningRequestById)
  .put(updateCleaningRequest)
  .delete(deleteCleaningRequest);

router.route("/property").get(getAllProperty);
router.route("/property/:propertyId").get(getPropertyById);
router.route("/cleaner").get(getAllCleaner);
router.route("/cleaner/:cleanerId").get(getCleanerById);

export default router;
