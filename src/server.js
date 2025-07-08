require("dotenv").config({ path: "./.env" });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const swagger = require("./config/swagger");
const logger = require("./utils/logger");
const qogitaService = require("./services/qogitaService");
const router = require("./routes/router");
const app = express();
const webhookRouter = require("./routes/webhookRoutes");
const PORT = process.env.PORT || 4000;
const path = require("path");
app.use(express.static(path.join(__dirname, "../public")));

try {
  app.use("/api-docs", swagger.serve, swagger.setup);
} catch (error) {
  logger.error("Swagger setup failed:", error);
}
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});
connectDB();
app.use(cors());
app.use("/webhook", webhookRouter);
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api", router);

app.get("/", (req, res) => {
  res.json({
    status: "working",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// Swagger Docs

// Global Error Handler
app.use((err, req, res, next) => {
  const errorDetails = {
    path: req.path,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body,
    error: {
      message: err.message,
      stack: err.stack,
      ...err,
    },
  };

  logger.error("Server error:", errorDetails);

  const statusCode = err.statusCode || res.statusCode || 500;
  const response = {
    success: false,
    message: err.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
});

// 404 Handler
app.use((req, res) => {
  logger.warn("Route not found:", {
    path: req.path,
    method: req.method,
  });
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});
(async () => {
  try {
    // Connect DB first
    await connectDB();

    // Initialize Qogita
    if (process.env.QOGITA_EMAIL && process.env.QOGITA_PASSWORD) {
      await qogitaService.initialize({
        email: process.env.QOGITA_EMAIL,
        password: process.env.QOGITA_PASSWORD,
      });
      logger.info("Qogita API initialized successfully");
    } else {
      logger.warn(
        "Qogita API credentials not found. Set QOGITA_EMAIL and QOGITA_PASSWORD."
      );
    }

    // Start server after everything is ready
    const server = app.listen(PORT, () => {
      logger.info(
        `Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`
      );
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Force shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Fatal error during startup:", err);
    process.exit(1);
  }
})();
