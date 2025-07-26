import express from "express";
import cors from "cors";
import morgan from "morgan";
import { consoleLogger, httpFileLogger } from "../utils/logger.js";
import { ApiRes } from "../utils/api.response.js";

const corsOption = {
  origin: process.env.CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
};

const morganFormat = ":method :url :status :response-time ms";
const apiVersion = "/api/v1";

const app = express();

app.use(cors(corsOption));
app.use(express.json({ limit: "24kb" }));
app.use(express.urlencoded({ limit: "24kb", extended: true }));
app.use(express.static("public"));

// --- MORGAN LOGGING MIDDLEWARE --->
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };

        consoleLogger.info(
          `(STATUS CODE: ${logObject.status}) => Method: ${logObject.method} | URL: '${logObject.url}' - [${logObject.responseTime}ms]`
        );

        httpFileLogger.info(message);
      },
    },
  })
);

// --- ROUTES IMPORTS --->
import employeeRoutes from "../routes/employee.routes.js";
import managerRoute from "../routes/manager.route.js";
import hrRoute from "../routes/hr.routes.js";
import partnerRoute from "../routes/partner.routes.js";
import hrManagerRoute from "../routes/hrManager.routes.js";

// --- ROUTES MIDDLEWARES --->
app.use(`${apiVersion}/employee`, employeeRoutes);
app.use(`${apiVersion}/manager`, managerRoute);
app.use(`${apiVersion}/hr`, hrRoute);
app.use(`${apiVersion}/partner`, partnerRoute);
app.use(`${apiVersion}/hr-manager`, hrManagerRoute);

// --- ERROR HANDLER MIDDLEWARE --->
app.use((err, req, res, next) => {
  console.error(err);
  consoleLogger.error(err.message);
  httpFileLogger.error(err);
  return res.status(err.status || 500).json(new ApiRes(500, null, err.message));
});

export { app };
