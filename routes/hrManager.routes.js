import { Router } from "express";
import {
  hrManagerLogin,
  submitHrManagerLeaveApplication,
} from "../controllers/hrManager.controller.js";

const router = Router();

router.route("/login").post(hrManagerLogin);
router.route("/submit-leave-application").post(submitHrManagerLeaveApplication);

export default router;
