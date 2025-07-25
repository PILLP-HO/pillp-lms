import { partnerList } from "../../services/excel.services.js";
import { formatWhatsappNumber } from "../utilities.js";

const getPartnerData = () => {
  const partner = partnerList.find(
    (partner) => partner["Work Location"]?.toLowerCase() === "all"
  );

  if (!partner) {
    throw new Error("No Partner found!");
  }

  if (!partner["WhatsApp Number"]) {
    throw new Error("Partner found but WhatsApp number is missing.");
  }

  return partner;
};

export { getPartnerData };
