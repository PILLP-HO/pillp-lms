import { asyncHandler } from "../utils/async.handler.js";
import { ApiRes, validateFields } from "../utils/api.response.js";
import {
  hrList,
  managerList,
  hrLeaveApplications,
  addHrLeaveApplication,
} from "../services/excel.services.js";
import {
  formatWhatsappNumber,
  generateLeaveId,
  sendWhatsappMessage,
} from "../utils/utilities.js";
import { getPartnerData } from "../utils/helpers/partner.helper.js";

const hrManagerLogin = asyncHandler(async (req, res) => {
  const { employeeCode, password } = req.body;

  if (!validateFields(req.body, ["employeeCode", "password"], res)) return;

  // First try to find in managerList
  const manager = managerList.find(
    (m) =>
      m["Employee Code"].toLowerCase() === employeeCode.toLowerCase() &&
      String(m["Password"]) === String(password)
  );

  if (manager) {
    return res.status(200).json(new ApiRes(200, manager));
  }

  // Now check hrList (department not needed)
  const hr = hrList.find(
    (h) =>
      h["Employee Code"].toLowerCase() === employeeCode.toLowerCase() &&
      String(h["Password"]) === String(password)
  );

  if (hr) {
    return res.status(200).json(new ApiRes(200, hr));
  }

  // If neither found
  return res.status(400).json(new ApiRes(400, null, "Invalid credentials!"));
});

const submitHrManagerLeaveApplication = asyncHandler(async (req, res) => {
  const { employeeCode, fromDate, toDate, leaveReason } = req.body;

  // Validate required fields
  if (
    !validateFields(
      req.body,
      ["employeeCode", "fromDate", "toDate", "leaveReason"],
      res
    )
  )
    return;

  // Validate leave reason length
  if (leaveReason.trim().length < 10) {
    return res
      .status(400)
      .json(
        new ApiRes(
          400,
          null,
          "Leave reason must be at least 10 characters long!"
        )
      );
  }

  // Parse and validate dates
  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (isNaN(from) || isNaN(to)) {
    return res.status(400).json(new ApiRes(400, null, "Invalid date format!"));
  }

  if (from > to) {
    return res
      .status(400)
      .json(new ApiRes(400, null, "From date cannot be after To date!"));
  }

  let user = managerList.find(
    (m) => m["Employee Code"].toLowerCase() === employeeCode.toLowerCase()
  );

  let userType = "Manager";

  if (!user) {
    user = hrList.find(
      (hr) => hr["Employee Code"].toLowerCase() === employeeCode.toLowerCase()
    );
    userType = "HR";
  }

  if (!user) {
    return res
      .status(400)
      .json(new ApiRes(400, null, "Invalid Employee Code!"));
  }

  // Check for existing pending application
  const isAlreadyPending = hrLeaveApplications.some(
    (application) =>
      application["Employee Code"] === employeeCode &&
      (application.Status === "Pending" ||
        application.Status === "Partner Approved")
  );

  if (isAlreadyPending) {
    return res
      .status(400)
      .json(new ApiRes(400, null, "A leave application is already pending!"));
  }

  // Get partner Data
  const partnerData = await getPartnerData();

  // Construct leave application entry
  const today = new Date().toISOString().split("T")[0];

  const data = {
    "Leave ID": generateLeaveId(),
    "Role": "Manager",
    "Employee Code": user["Employee Code"],
    "Employee Name": user["Employee Name"],
    "WhatsApp Number": user["WhatsApp Number"],
    "Email": user["Email"],
    "Designation": user["Designation"],
    "Department": user["Department"],
    "Work Location": user["Work Location"],
    "From Date": fromDate,
    "To Date": toDate,
    "Leave Reason": leaveReason.trim(),
    "Status": "Pending",
    "Submission Date": today,
    "Last Updated": today,
  };

  addHrLeaveApplication(data);

  await sendWhatsappMessage(
    formatWhatsappNumber(partnerData["WhatsApp Number"]),
    "hr_leave_submission",
    {
      1: user["Employee Name"],
      2: user["Work Location"],
      3: fromDate,
      4: toDate,
      5: leaveReason,
    }
  );

  return res
    .status(200)
    .json(new ApiRes(200, null, "Leave application submitted successfully!"));
});

export { hrManagerLogin, submitHrManagerLeaveApplication };
