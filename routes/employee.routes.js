import { Router } from "express";
import {
  printAllLists,
  employeeLogin,
  submitEmployeeLeaveApplication,
} from "../controllers/employee.controller.js";

const router = Router();

router.route("/print-all-lists").get(printAllLists);

router.route("/login").post(employeeLogin);
router.route("/submit-leave-application").post(submitEmployeeLeaveApplication);

export default router;
