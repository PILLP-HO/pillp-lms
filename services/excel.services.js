import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "..", "data");
const generatedDir = path.join("/tmp", "generated");

// Make sure the generated folder exists
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

// --- Generic Utilities ---

// Header definitions
const employeeLeaveHeaders = [
  "Leave ID",
  "Role",
  "Employee Code",
  "Employee Name",
  "WhatsApp Number",
  "Email",
  "Designation",
  "Department",
  "Work Location",
  "From Date",
  "To Date",
  "Leave Reason",
  "Manager Employee Code",
  "Status",
  "Submission Date",
  "Last Updated",
];

const hrLeaveHeaders = [
  "Leave ID",
  "Role",
  "Employee Code",
  "Employee Name",
  "WhatsApp Number",
  "Email",
  "Designation",
  "Department",
  "Work Location",
  "From Date",
  "To Date",
  "Leave Reason",
  "Status",
  "Submission Date",
  "Last Updated",
];

// Create with headers
function createExcelWithHeaders(folder, fileName, headers) {
  const headerRow = {};
  headers.forEach((key) => {
    headerRow[key] = ""; // Empty values
  });
  writeExcel(folder, fileName, [headerRow]); // write with 1 header row
}

// Modified readExcel to accept optional headers
function readExcel(folder, fileName, headers = null) {
  const filePath = path.join(folder, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`${fileName} not found. Creating with headers...`);
    if (headers) {
      createExcelWithHeaders(folder, fileName, headers);
    } else {
      writeExcel(folder, fileName, []);
    }
    return [];
  }

  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
}

// Write to a folder
function writeExcel(folder, fileName, data) {
  const filePath = path.join(folder, fileName);
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
  xlsx.writeFile(wb, filePath);
}

// --- Load 5 static files from /data ---

export const employeeList = readExcel(dataDir, "employee_list.xlsx");
export const hrList = readExcel(dataDir, "hr_list.xlsx");
export const hrManagerList = readExcel(dataDir, "hr_manager_list.xlsx");
export const managerList = readExcel(dataDir, "manager_list.xlsx");
export const partnerList = readExcel(dataDir, "partner_list.xlsx");

// --- Load editable files from /data/generated ---

export let employeeLeaveApplications = readExcel(
  generatedDir,
  "employee_leave_applications.xlsx",
  employeeLeaveHeaders
);

export let hrLeaveApplications = readExcel(
  generatedDir,
  "hr_leave_applications.xlsx",
  hrLeaveHeaders
);

// --- Save + reload methods ---

export function addEmployeeLeaveApplication(entry) {
  employeeLeaveApplications.push(entry);
  writeExcel(
    generatedDir,
    "employee_leave_applications.xlsx",
    employeeLeaveApplications
  );
  employeeLeaveApplications = readExcel(
    generatedDir,
    "employee_leave_applications.xlsx"
  );
}

export function addHrLeaveApplication(entry) {
  hrLeaveApplications.push(entry);
  writeExcel(generatedDir, "hr_leave_applications.xlsx", hrLeaveApplications);
  hrLeaveApplications = readExcel(generatedDir, "hr_leave_applications.xlsx");
}

// --- Excel download paths ---

export function getExcelFilePath(fileType) {
  const files = {
    employee: "employee_leave_applications.xlsx",
    hr: "hr_leave_applications.xlsx",
  };
  return path.join(generatedDir, files[fileType]);
}

// --- Utility functions ---
export function updateEmployeeLeaveList() {
  writeExcel(
    generatedDir,
    "employee_leave_applications.xlsx",
    employeeLeaveApplications
  );
  employeeLeaveApplications = readExcel(
    generatedDir,
    "employee_leave_applications.xlsx"
  );
}

export function updateHrLeaveList() {
  writeExcel(generatedDir, "hr_leave_applications.xlsx", hrLeaveApplications);
  hrLeaveApplications = readExcel(generatedDir, "hr_leave_applications.xlsx");
}
