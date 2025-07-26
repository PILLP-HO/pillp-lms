import { asyncHandler } from "../utils/async.handler.js";
import { ApiRes, validateFields } from "../utils/api.response.js";
import {
  employeeList,
  managerList,
  employeeLeaveApplications,
  updateEmployeeLeaveList,
  hrLeaveApplications,
  addHrLeaveApplication,
} from "../services/excel.services.js";
import {
  formatWhatsappNumber,
  sendWhatsappMessage,
} from "../utils/utilities.js";
import { getHrData } from "../utils/helpers/hr.helper.js";
import { getPartnerData } from "../utils/helpers/partner.helper.js";

const managerLogin = asyncHandler(async (req, res) => {
  const { employeeCode, password } = req.body;

  if (!validateFields(req.body, ["employeeCode", "password"], res)) return;

  for (const manager of managerList) {
    const empCode = manager["Employee Code"];
    const empPassword = manager["Password"];

    if (
      empCode.toLowerCase() === employeeCode.toLowerCase() &&
      String(empPassword) === String(password)
    ) {
      return res.status(200).json(new ApiRes(200, manager));
    }
  }

  // only reached if no match found
  return res.status(404).json(new ApiRes(404, null, "Manager not found!"));
});

const getPendingLeaves = asyncHandler(async (req, res) => {
  const { employeeCode } = req.query;

  if (!validateFields(req.query, ["employeeCode"], res)) return;

  const manager = managerList.find(
    (manager) =>
      manager["Employee Code"].toLowerCase() === employeeCode.toLowerCase()
  );

  if (!manager) {
    return res.status(404).json(new ApiRes(404, null, "Manager not found!"));
  }

  const pendingLeaves = employeeLeaveApplications.filter(
    (leave) =>
      leave["Manager Employee Code"].toLowerCase() ===
        manager["Employee Code"].toLowerCase() && leave["Status"] === "Pending"
  );

  return res.status(200).json(new ApiRes(200, pendingLeaves));
});

const changeLeaveApplicationStatus = asyncHandler(async (req, res) => {
  const { leaveId, status } = req.body;

  // Validate input fields
  if (!validateFields(req.body, ["leaveId", "status"], res)) return;

  // Find the leave entry
  const leave = employeeLeaveApplications.find(
    (leave) => leave["Leave ID"] === leaveId
  );

  if (!leave) {
    return res.status(404).json(new ApiRes(404, null, "Leave not found!"));
  }

  // Find the associated employee
  const employee = employeeList.find(
    (emp) => emp["Employee Code"] === leave["Employee Code"]
  );

  if (!employee) {
    return res.status(404).json(new ApiRes(404, null, "Employee not found!"));
  }

  // Update leave status
  const isApproved = status === "Approved";
  leave["Status"] = isApproved ? "Manager Approved" : "Manager Rejected";
  leave["Last Updated"] = new Date().toISOString().split("T")[0];

  // Update in-memory list
  const index = employeeLeaveApplications.findIndex(
    (l) => l["Leave ID"] === leaveId
  );
  employeeLeaveApplications[index] = leave;

  // Write to file and reload list
  updateEmployeeLeaveList();

  // Notify HR or employee
  if (isApproved) {
    const hrData = getHrData();
    await sendWhatsappMessage(
      formatWhatsappNumber(hrData["WhatsApp Number"]),
      "manager_approval",
      {
        1: employee["Employee Name"],
        2: employee["Employee Code"],
        3: employee["Department"],
        4: employee["Work Location"],
      }
    );
  } else {
    await sendWhatsappMessage(
      formatWhatsappNumber(employee["WhatsApp Number"]),
      "manager_rejection",
      {
        1: employee["Employee Name"],
      }
    );
  }

  return res.status(200).json(new ApiRes(200, null, "Leave status updated!"));
});

const submitManagerLeaveApplication = asyncHandler(async (req, res) => {
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

  // Find Manager
  const manager = managerList.find(
    (manager) => manager["Employee Code"] === employeeCode
  );

  if (!manager) {
    return res.status(404).json(new ApiRes(404, null, "Manager not found!"));
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
    "Employee Code": manager["Employee Code"],
    "Employee Name": manager["Employee Name"],
    "WhatsApp Number": manager["WhatsApp Number"],
    "Email": manager["Email"],
    "Designation": manager["Designation"],
    "Department": manager["Department"],
    "Work Location": manager["Work Location"],
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
      1: manager["Employee Name"],
      2: manager["Work Location"],
      3: fromDate,
      4: toDate,
      5: leaveReason,
    }
  );

  return res
    .status(200)
    .json(new ApiRes(200, null, "Leave application submitted successfully!"));
});

export { managerLogin, getPendingLeaves, changeLeaveApplicationStatus };
