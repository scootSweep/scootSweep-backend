import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN === "*" ? true : process.env.CORS_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import

import healthcheckRouter from "./routes/healthcheck.routes.js";
import auth from "./routes/auth.routes.js";
import request from "./routes/cleaningRequest.routes.js";
import admin from "./routes/admin.routes.js";
import cleaner from "./routes/cleaner.routes.js";

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/auth", auth);
app.use("/api/v1/request", request);
app.use("/api/v1/admin", admin);
app.use("/api/v1/cleaner", cleaner);

// http://localhost:8000/api/v1/users/register

export { app };
