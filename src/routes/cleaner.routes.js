import { Router } from "express";
import { verifyCleaner } from "../middlewares/auth.middleware.js";
import cleanerService from "../services/cleaner.service.js";
const router = Router();
// router.use(verifyCleaner);

router.route("/property-location").get(cleanerService.getAllPropertyLocation);

export default router;
