import { asyncHandler } from "../utils/async.handler.js";
import { ApiRes, validateFields } from "../utils/api.response.js";
import {
  employeeList,
  hrList,
  hrManagerList,
  managerList,
  partnerList,
  employeeLeaveApplications,
  addEmployeeLeaveApplication,
} from "../services/excel.services.js";
import { getManagerData } from "../utils/helpers/manager.helper.js";
import {
  formatDateToShortMonth,
  formatWhatsappNumber,
  sendWhatsappMessage,
} from "../utils/utilities.js";
import { generateLeaveId } from "../utils/utilities.js";

const printAllLists = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiRes(200, {
      employeeList,
      hrList,
      hrManagerList,
      managerList,
      partnerList,
    })
  );
});

const employeeLogin = asyncHandler(async (req, res) => {
  const { name, whatsappNumber } = req.body;

  if (!validateFields(req.body, ["name", "whatsappNumber"], res)) return;

  for (const employee of employeeList) {
    const empName = employee["Employee Name"];
    const empWhatsapp = employee["WhatsApp Number"];

    if (
      empName.toLowerCase() === name.toLowerCase() &&
      String(empWhatsapp).toLowerCase() === whatsappNumber.toLowerCase()
    ) {
      return res.status(200).json(new ApiRes(200, employee));
    }
  }

  return res.status(404).json(new ApiRes(404, null, "Employee not found!"));
});

const submitEmployeeLeaveApplication = asyncHandler(async (req, res) => {
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

  // Find employee
  const employee = employeeList.find(
    (emp) => emp["Employee Code"] === employeeCode
  );

  if (!employee) {
    return res.status(404).json(new ApiRes(404, null, "Employee not found!"));
  }

  // Check for existing pending application
  const isAlreadyPending = employeeLeaveApplications.some(
    (application) =>
      application["Employee Code"] === employeeCode &&
      (application.Status === "Pending" ||
        application.Status === "Manager Approved")
  );

  if (isAlreadyPending) {
    return res
      .status(400)
      .json(new ApiRes(400, null, "A leave application is already pending!"));
  }

  // Get manager Data
  const managerData = await getManagerData(
    employee["Department"],
    employee["Work Location"]
  );

  // Construct leave application entry
  const today = new Date().toISOString().split("T")[0];

  const data = {
    "Leave ID": generateLeaveId(),
    "Role": "Employee",
    "Employee Code": employee["Employee Code"],
    "Employee Name": employee["Employee Name"],
    "WhatsApp Number": employee["WhatsApp Number"],
    "Email": employee["Email"],
    "Designation": employee["Designation"],
    "Department": employee["Department"],
    "Work Location": employee["Work Location"],
    "From Date": formatDateToShortMonth(fromDate),
    "To Date": formatDateToShortMonth(toDate),
    "Leave Reason": leaveReason.trim(),
    "Manager Employee Code": managerData["Employee Code"],
    "Status": "Pending",
    "Submission Date": today,
    "Last Updated": today,
  };

  addEmployeeLeaveApplication(data);

  await sendWhatsappMessage(
    formatWhatsappNumber(managerData["WhatsApp Number"]),
    "new_leave_request",
    {
      1: employee["Employee Name"],
      2: employee["Employee Code"],
      3: employee["Designation"],
      4: employee["Work Location"],
      5: formatDateToShortMonth(fromDate),
      6: formatDateToShortMonth(toDate),
      7: leaveReason,
    }
  );

  return res
    .status(200)
    .json(new ApiRes(200, null, "Leave application submitted successfully!"));
});

export { printAllLists, employeeLogin, submitEmployeeLeaveApplication };
