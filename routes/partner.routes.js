import { Router } from "express";
import {
  partnerLogin,
  getPendingLeaves,
  changeLeaveApplicationStatus,
} from "../controllers/partner.controller.js";

const router = Router();

router.route("/login").post(partnerLogin);
router.route("/get-pending-leaves").get(getPendingLeaves);
router
  .route("/change-leave-application-status")
  .put(changeLeaveApplicationStatus);

export default router;
