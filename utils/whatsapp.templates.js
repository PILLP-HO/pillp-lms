import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

// WhatsApp Template SIDs from environment variables
export const WHATSAPP_TEMPLATES = {
  new_leave_request: process.env.WHATSAPP_TEMPLATE_NEW_LEAVE_REQUEST,
  manager_approval: process.env.WHATSAPP_TEMPLATE_MANAGER_APPROVAL,
  manager_rejection: process.env.WHATSAPP_TEMPLATE_MANAGER_REJECTION,
  hr_approval_hr_leave: process.env.WHATSAPP_TEMPLATE_HR_APPROVAL_HR_LEAVE,
  hr_rejection_hr_leave: process.env.WHATSAPP_TEMPLATE_HR_REJECTION_HR_LEAVE,
  hr_approval_regular: process.env.WHATSAPP_TEMPLATE_HR_APPROVAL_REGULAR,
  hr_rejection_regular: process.env.WHATSAPP_TEMPLATE_HR_REJECTION_REGULAR,
  partner_approval: process.env.WHATSAPP_TEMPLATE_PARTNER_APPROVAL,
  partner_rejection: process.env.WHATSAPP_TEMPLATE_PARTNER_REJECTION,
  hr_leave_submission: process.env.WHATSAPP_TEMPLATE_HR_LEAVE_SUBMISSION,
};
