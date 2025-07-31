import { asyncHandler } from "../utils/async.handler.js";
import { ApiRes, validateFields } from "../utils/api.response.js";
import {
  hrList,
  managerList,
  hrLeaveApplications,
  addHrLeaveApplication,
  hrManagerList,
} from "../services/excel.services.js";
import {
  formatDateToShortMonth,
  formatWhatsappNumber,
  generateLeaveId,
  sendWhatsappMessage,
} from "../utils/utilities.js";
import { getPartnerData } from "../utils/helpers/partner.helper.js";

const hrManagerLogin = asyncHandler(async (req, res) => {
  const { employeeCode, password } = req.body;

  if (!validateFields(req.body, ["employeeCode", "password"], res)) return;

  for (const user of hrManagerList) {
    const empCode = user["Employee Code"];
    const empPassword = user["Password"];

    if (
      empCode.toLowerCase() === employeeCode.toLowerCase() &&
      String(empPassword) === String(password)
    ) {
      return res.status(200).json(new ApiRes(200, user));
    }
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

  let user = hrManagerList.find(
    (user) => user["Employee Code"].toLowerCase() === employeeCode.toLowerCase()
  );

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
    "Role": hrList.find(
      (hr) =>
        hr["Employee Code"].toLowerCase() ===
        user["Employee Code"].toLowerCase()
    )
      ? "HR"
      : "Manager",
    "Employee Code": user["Employee Code"],
    "Employee Name": user["Employee Name"],
    "WhatsApp Number": user["WhatsApp Number"],
    "Email": user["Email"],
    "Designation": user["Designation"],
    "Department": user["Department"],
    "Work Location": user["Work Location"],
    "From Date": formatDateToShortMonth(fromDate),
    "To Date": formatDateToShortMonth(toDate),
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
      3: formatDateToShortMonth(fromDate),
      4: formatDateToShortMonth(toDate),
      5: leaveReason,
    }
  );

  return res
    .status(200)
    .json(new ApiRes(200, null, "Leave application submitted successfully!"));
});

export { hrManagerLogin, submitHrManagerLeaveApplication };
