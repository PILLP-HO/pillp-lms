import { asyncHandler } from "../utils/async.handler.js";
import { ApiRes, validateFields } from "../utils/api.response.js";
import {
  employeeList,
  hrList,
  employeeLeaveApplications,
  updateEmployeeLeaveList,
  hrLeaveApplications,
  updateHrLeaveList,
  addHrLeaveApplication,
  managerList,
  hrManagerList,
} from "../services/excel.services.js";
import {
  formatDateToShortMonth,
  formatWhatsappNumber,
  generateLeaveId,
  sendWhatsappMessage,
} from "../utils/utilities.js";
import { getPartnerData } from "../utils/helpers/partner.helper.js";

const hrLogin = asyncHandler(async (req, res) => {
  const { employeeCode, password } = req.body;

  if (!validateFields(req.body, ["employeeCode", "password"], res)) return;

  for (const hr of hrList) {
    const empCode = hr["Employee Code"];
    const empPassword = hr["Password"];

    if (
      empCode.toLowerCase() === employeeCode.toLowerCase() &&
      String(empPassword) === String(password)
    ) {
      return res.status(200).json(new ApiRes(200, hr));
    }
  }

  return res.status(404).json(new ApiRes(404, null, "HR not found!"));
});

const getPendingLeaves = asyncHandler(async (req, res) => {
  const pendingRequests = [
    ...employeeLeaveApplications.filter(
      (leave) => leave["Status"] === "Manager Approved"
    ),
    ...hrLeaveApplications.filter(
      (leave) => leave["Status"] === "Partner Approved"
    ),
  ];

  return res.status(200).json(new ApiRes(200, pendingRequests));
});

const changeLeaveApplicationStatus = asyncHandler(async (req, res) => {
  const { leaveId, status } = req.body;

  // Validate input fields
  if (!validateFields(req.body, ["leaveId", "status"], res)) return;

  // Find leave in both lists
  let leave = employeeLeaveApplications.find(
    (leave) => leave["Leave ID"] === leaveId
  );
  let leaveFor = "Employee";

  if (!leave) {
    leave = hrLeaveApplications.find((leave) => leave["Leave ID"] === leaveId);
    if (!leave) {
      return res.status(404).json(new ApiRes(404, null, "Leave not found!"));
    }
    leaveFor = "HR/Manager";
  }

  const employeeCode = leave["Employee Code"].toLowerCase();

  let employee =
    employeeList.find(
      (emp) => emp["Employee Code"].toLowerCase() === employeeCode
    ) ||
    managerList.find(
      (mgr) => mgr["Employee Code"].toLowerCase() === employeeCode
    ) ||
    hrList.find((mgr) => mgr["Employee Code"].toLowerCase() === employeeCode) ||
    hrManagerList.find(
      (mgr) => mgr["Employee Code"].toLowerCase() === employeeCode
    );

  if (!employee) {
    return res.status(404).json(new ApiRes(404, null, "Employee not found!"));
  }

  // Update leave status
  const isApproved = status === "Approved";
  leave["Status"] = isApproved ? "HR Approved" : "HR Rejected";
  leave["Last Updated"] = new Date().toISOString().split("T")[0];

  // Save updated leave
  if (leaveFor === "Employee") {
    const index = employeeLeaveApplications.findIndex(
      (l) => l["Leave ID"] === leaveId
    );
    employeeLeaveApplications[index] = leave;
    updateEmployeeLeaveList();
  } else {
    const index = hrLeaveApplications.findIndex(
      (l) => l["Leave ID"] === leaveId
    );
    hrLeaveApplications[index] = leave;
    updateHrLeaveList();
  }

  // Send WhatsApp notification
  const number = formatWhatsappNumber(employee["WhatsApp Number"]);

  if (leaveFor === "HR/Manager") {
    await sendWhatsappMessage(
      number,
      isApproved ? "hr_approval_hr_leave" : "hr_rejection_hr_leave",
      isApproved
        ? {
            1: employee["Employee Name"],
            2: formatDateToShortMonth(leave["From Date"]),
            3: formatDateToShortMonth(leave["To Date"]),
            4: "N/A",
            5: leave["Leave Reason"],
          }
        : {
            1: employee["Employee Name"],
            2: formatDateToShortMonth(leave["From Date"]),
            3: formatDateToShortMonth(leave["To Date"]),
            4: leave["Leave Reason"],
          }
    );
  } else {
    await sendWhatsappMessage(
      number,
      isApproved ? "hr_approval_regular" : "hr_rejection_regular",
      {
        1: employee["Employee Name"],
        2: formatDateToShortMonth(leave["From Date"]),
        3: formatDateToShortMonth(leave["To Date"]),
      }
    );
  }

  return res.status(200).json(new ApiRes(200, null, "Leave status updated!"));
});

const submitHrLeaveApplication = asyncHandler(async (req, res) => {
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

  // Find HR
  const hr = hrList.find((hr) => hr["Employee Code"] === employeeCode);

  if (!hr) {
    return res.status(404).json(new ApiRes(404, null, "HR not found!"));
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
    "Role": "HR",
    "Employee Code": hr["Employee Code"],
    "Employee Name": hr["Employee Name"],
    "WhatsApp Number": hr["WhatsApp Number"],
    "Email": hr["Email"],
    "Designation": hr["Designation"],
    "Department": hr["Department"],
    "Work Location": hr["Work Location"],
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
      1: hr["Employee Name"],
      2: hr["Work Location"],
      3: fromDate,
      4: toDate,
      5: leaveReason,
    }
  );

  return res
    .status(200)
    .json(new ApiRes(200, null, "Leave application submitted successfully!"));
});

export { hrLogin, getPendingLeaves, changeLeaveApplicationStatus };
