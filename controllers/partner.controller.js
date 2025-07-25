import { asyncHandler } from "../utils/async.handler.js";
import { ApiRes, validateFields } from "../utils/api.response.js";
import {
  employeeList,
  partnerList,
  hrLeaveApplications,
  updateHrLeaveList,
} from "../services/excel.services.js";
import {
  formatWhatsappNumber,
  sendWhatsappMessage,
} from "../utils/utilities.js";
import { getHrData } from "../utils/helpers/hr.helper.js";

const partnerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!validateFields(req.body, ["employeeCode", "password"], res)) return;

  for (const partner of partnerList) {
    const partnerEmail = hr["Email"];
    const partnerPassword = hr["Password"];

    if (
      partnerEmail.toLowerCase() === email.toLowerCase() &&
      String(partnerPassword) === String(password)
    ) {
      return res.status(200).json(new ApiRes(200, partner));
    }
  }

  return res.status(404).json(new ApiRes(404, null, "Partner not found!"));
});

const getPendingLeaves = asyncHandler(async (req, res) => {
  const pendingRequests = hrLeaveApplications.filter(
    (leave) => leave["Status"] === "Pending"
  );

  return res.status(200).json(new ApiRes(200, pendingRequests));
});

const changeLeaveApplicationStatus = asyncHandler(async (req, res) => {
  const { leaveId, status } = req.body;

  // Validate input fields
  if (!validateFields(req.body, ["leaveId", "status"], res)) return;

  // Find the leave entry
  const leave = hrLeaveApplications.find(
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
  const index = hrLeaveApplications.findIndex((l) => l["Leave ID"] === leaveId);
  hrLeaveApplications[index] = leave;

  // Write to file and reload list
  updateHrLeaveList();

  // Notify HR or employee
  if (isApproved) {
    const hrData = getHrData();
    await sendWhatsappMessage(
      formatWhatsappNumber(hrData["WhatsApp Number"]),
      "partner_approval",
      {
        1: employee["Employee Name"],
        2: employee["From Date"],
        3: employee["To Date"],
        4: employee["Leave Reason"],
      }
    );
  } else {
    await sendWhatsappMessage(
      formatWhatsappNumber(employee["WhatsApp Number"]),
      "partner_rejection",
      {
        1: employee["Employee Name"],
        2: employee["From Date"],
        3: employee["To Date"],
        4: employee["Leave Reason"],
      }
    );
  }

  return res.status(200).json(new ApiRes(200, null, "Leave status updated!"));
});

export { partnerLogin, getPendingLeaves, changeLeaveApplicationStatus };
