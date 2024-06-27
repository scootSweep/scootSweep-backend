import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { ApiError } from "./utils/ApiError.js";

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN === "*" ? true : process.env.CORS_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import

import healthcheckRouter from "./routes/healthcheck.routes.js";
import auth from "./routes/auth.routes.js";
import admin from "./routes/admin.routes.js";
import cleaner from "./routes/cleaner.routes.js";

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/auth", auth);
app.use("/api/v1/admin", admin);
app.use("/api/v1/cleaner", cleaner);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      status_code: err.statusCode,
      message: err.message,
      title: "Error",
      exception: err.message,
    });
  } else {
    res.status(500).json({
      status_code: 500,
      message: "Internal Server Error",
      title: "Error",
      exception: err.message,
    });
  }
});

// http://localhost:8000/api/v1/users/register

export { app };
