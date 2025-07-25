import { managerList } from "../../services/excel.services.js";
import { formatWhatsappNumber } from "../utilities.js";

const getManagerData = (department, workLocation) => {
  if (!department || !workLocation) {
    throw new Error("Department and Work Location are required!");
  }

  const manager = managerList.find(
    (manager) =>
      (manager["Department"]?.toLowerCase() === department.toLowerCase() ||
        manager["Department"]?.toLowerCase() === "all") &&
      manager["Work Location"]?.toLowerCase() === workLocation.toLowerCase()
  );

  if (!manager) {
    throw new Error(
      `No manager found for department "${department}" and location "${workLocation}"`
    );
  }

  if (!manager["WhatsApp Number"]) {
    throw new Error("Manager found but WhatsApp number is missing.");
  }

  return manager;
};

export { getManagerData };
