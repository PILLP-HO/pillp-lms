import { hrList } from "../../services/excel.services.js";
import { formatWhatsappNumber } from "../utilities.js";

const getHrData = () => {
  const hr = hrList.find(
    (hr) =>
      hr["Designation"]?.toLowerCase() === "hr executive" &&
      hr["Work Location"]?.toLowerCase() === "all"
  );

  if (!hr) {
    throw new Error("No HR found!");
  }

  if (!hr["WhatsApp Number"]) {
    throw new Error("HR found but WhatsApp number is missing.");
  }

  return hr;
};

export { getHrData };
