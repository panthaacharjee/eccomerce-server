import { Request, Response } from "express";

const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const errorMiddleware = require("./backend/middleware/error");
const cors = require("cors");

app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  fileUpload({
    useTempFiles: false, // ← THIS IS CRITICAL!
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 },
  }),
);
app.use(express.json({ limit: "50mb" }));

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://eccomerce-user-panel.vercel.app",
    "https://eccomerce-admin-panel.vercel.app"

  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(cookieParser());

/* ================================================ */
/* =============== ROUTES IMPORT ================== */
/* ================================================ */
const user = require("./backend/routes/authRoute");
const product = require("./backend/routes/productRoute");
const setting = require("./backend/routes/settingsRoute");
const home = require("./backend/routes/homeRoute");
const order = require("./backend/routes/orderRoute");

/* ================================================ */
/* =============== ROUTES USE ================== */
/* ================================================ */
app.use("/api/v1", user);
app.use("/api/v1", product);
app.use("/api/v1", setting);
app.use("/api/v1", home);
app.use("/api/v1", order);

app.get("/api/v1/testing/server", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "SUCCESS SERVER RUNNING",
    arrayData: ["Pantha", 25, { Pantha: "Pantha" }],
  });
});

app.use(errorMiddleware);

module.exports = app;
