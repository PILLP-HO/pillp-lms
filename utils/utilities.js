import { asyncHandler } from "./async.handler.js";
import twilio from "twilio";
import { WHATSAPP_TEMPLATES } from "./whatsapp.templates.js";
import { consoleLogger } from "./logger.js";
import { nanoid } from "nanoid";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function formatWhatsappNumber(phoneNumber) {
  // Return null if phone number is missing or empty
  if (!phoneNumber) return null;

  // Remove all non-digit characters
  const cleaned = String(phoneNumber).replace(/\D/g, "");

  // Format based on conditions
  if (cleaned.startsWith("0")) {
    return `whatsapp:+91${cleaned.slice(1)}`;
  } else if (cleaned.length === 10) {
    return `whatsapp:+91${cleaned}`;
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    return `whatsapp:+${cleaned}`;
  } else if (String(phoneNumber).startsWith("+91")) {
    return `whatsapp:${phoneNumber}`;
  } else if (cleaned.startsWith("9") && cleaned.length === 10) {
    return `whatsapp:+91${cleaned}`;
  } else {
    return `whatsapp:+${cleaned}`; // Fallback
  }
}

const sendWhatsappMessage = asyncHandler(
  async (toNumber, templateName = null, templateVars) => {
    const templateSid = WHATSAPP_TEMPLATES[templateName];
    if (!templateSid) {
      consoleLogger.error(`No template SID found for "${templateName}"`);
      return false;
    }

    const response = await client.messages.create({
      from: "whatsapp:+17404486222", // Your Twilio WhatsApp Number
      contentSid: templateSid,
      contentVariables: JSON.stringify(templateVars),
      to: toNumber,
    });

    consoleLogger.info(`Template '${templateName}' sent. SID: ${response.sid}`);
    return true;
  }
);

function generateLeaveId() {
  const timestamp = Date.now(); // milliseconds since epoch
  const randomPart = nanoid(4).toUpperCase(); // short random string
  return `LV-${timestamp}-${randomPart}`;
}

function formatDateToShortMonth(dateStr) {
  const date = new Date(dateStr);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-GB", options).replace(/ /g, "-");
}

export {
  formatWhatsappNumber,
  sendWhatsappMessage,
  generateLeaveId,
  formatDateToShortMonth,
};
