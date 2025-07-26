import { Router } from "express";
import {
  hrLogin,
  getPendingLeaves,
  changeLeaveApplicationStatus,
} from "../controllers/hr.controller.js";

const router = Router();

router.route("/login").post(hrLogin);
router.route("/get-pending-leaves").get(getPendingLeaves);
router
  .route("/change-leave-application-status")
  .put(changeLeaveApplicationStatus);

export default router;
