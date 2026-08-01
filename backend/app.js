require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");
const SqliteSessionStore = require("./sessionStore");
const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim());
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET)
  throw new Error("SESSION_SECRET is required in production.");
if (process.env.TRUST_PROXY)
  app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Origin not allowed"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
const secureCookie = process.env.COOKIE_SECURE === "true";
const sessionName = secureCookie ? "__Host-smartlib.sid" : "smartlib.sid";
app.use(
  session({
    name: sessionName,
    secret: process.env.SESSION_SECRET || "smartlib-local-secret-change-me",
    store: new SqliteSessionStore(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookie,
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    service: "smartlib-api",
    time: new Date().toISOString(),
  }),
);
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadDir));
app.use("/api", routes);
app.use((err, req, res, next) => {
  console.error(
    JSON.stringify({
      error: err.message,
      stack: err.stack,
      method: req.method,
      path: req.path,
    }),
  );
  if (res.headersSent) return next(err);
  if (err.code === "SQLITE_CONSTRAINT" || err.code === "SQLITE_BUSY")
    return res
      .status(400)
      .json({ message: "Dữ liệu đang được sử dụng hoặc hệ thống đang bận." });
  res
    .status(err.status || 500)
    .json({ message: err.status ? err.message : "Lỗi máy chủ." });
});
module.exports = app;
