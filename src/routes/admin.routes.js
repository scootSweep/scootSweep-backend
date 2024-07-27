import {
  Dashboard,
  getAllProperty,
  getPropertyById,
  getAllCleaner,
  getCleanerById,
  createContactInfo,
  registerCleanerbyAdmin,
  getAllContactInfo,
  deleteContactInfo,
  getAllCleaningInvoice,
  toggleInvoicePaymentStatus,
  getInvoicePaymentStatusbyId,
  getAllRedeployment,
  deleteProperty,
  deleteCleaner,
} from "../controllers/admin.controller.js";
import { registerCleaner } from "../controllers/auth.controller.js";
import { Router } from "express";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Dashboard
router.route("/dashboard").get(Dashboard);

// cleaner-routes
router.route("/register/cleaner").post(
  upload.single("idImage"), // Use upload.single middleware for single file uploads with the field name "idImage"
  (req, res, next) => {
    next();
  },
  registerCleanerbyAdmin
);
router.use(verifyAdmin);
// router.route("/register/cleaner").post(upload.none(), registerCleaner);

router.route("/property").get(getAllProperty);
router.route("/property/:propertyId").get(getPropertyById);
router.route("/cleaner").get(getAllCleaner);
router.route("/cleaner/:cleanerId").get(getCleanerById);

router.route("/contact").post(createContactInfo).get(getAllContactInfo);
router.route("/contact/:contactInfoId").delete(deleteContactInfo);

// cleaning-invoice-routes

router.route("/cleaning-invoice").get(getAllCleaningInvoice);
router
  .route("/cleaning-invoice/:cleaningInvoiceId/:cleanerId")
  .patch(toggleInvoicePaymentStatus);
router
  .route("/cleaning-invoice/:cleaningInvoiceId")
  .get(getInvoicePaymentStatusbyId);

// redeployment-routes
router.route("/redeployment").get(getAllRedeployment);

// delete-property-cleaner
router.route("/property/:propertyId").delete(deleteProperty);
router.route("/cleaner/:cleanerId").delete(deleteCleaner);

export default router;
