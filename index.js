require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const connectDb = require("./src/config/db");

const requestController = require("./src/controllers/request_conroller");
const authController = require("./src/controllers/auth_controller");

const { startWhatsAppWatcher } = require("./src/whatsapp");
const {
  getWhatsAppStatus,
  getWhatsAppQrDataUrl,
} = require("./src/services/watsup.service");

const app = express();

// Render runs behind a proxy; needed for correct client IPs in rate limiting
app.set("trust proxy", 1);

// CORS configuration
app.use(
  cors({
    origin: [
      "https://www.onlinesolutionhub.com",
      "https://onlinesolutionhub.com",
      "http://localhost:5173",
    ],
  })
);

app.use(express.json());

// Limit spam on the public form endpoint
const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "OnlineSolutionHub backend is running",
  });
});

// Create service request
app.post("/api/request", requestLimiter, requestController.createRequest);

// Get all requests
app.get("/api/getRequests", requestController.getAllRequests);

// Update request
app.patch("/api/updateRequest/:id", requestController.updateRequest);

// Delete request
app.delete("/api/deleteRequest/:id", requestController.deleteRequest);

// Admin registration
app.post("/api/register", authController.registerUser);

// Admin login
app.post("/api/login", authController.loginUser);

// WhatsApp login QR page (protected by WA_QR_KEY)
app.get("/api/whatsapp/qr", async (req, res) => {
  const secret = process.env.WA_QR_KEY;

  // Never allow access when the key is not configured
  if (!secret || req.query.key !== secret) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const status = getWhatsAppStatus();
    const qr = await getWhatsAppQrDataUrl();

    res.set("Cache-Control", "no-store");
    res.send(`
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="refresh" content="5">
      <body style="font-family:sans-serif;text-align:center;padding:40px">
        <h2>WhatsApp status: ${status}</h2>
        ${
          qr
            ? `<img src="${qr}" alt="WhatsApp QR code" />
               <p>Open WhatsApp &rarr; Linked devices &rarr; Link a device, then scan.</p>`
            : status === "ready"
            ? "<p>Connected. Nothing to scan.</p>"
            : "<p>No QR code yet. This page refreshes every 5 seconds.</p>"
        }
      </body>
    `);
  } catch (error) {
    res.status(500).send("Could not load WhatsApp status");
  }
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Keep a WhatsApp/Puppeteer error from crashing the whole server
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to MongoDB first
    await connectDb();

    console.log("MongoDB connected successfully");

    const server = app.listen(PORT, () => {
      console.log(`OnlineSolutionHub backend is running on port ${PORT}`);

      // Start WhatsApp watcher after MongoDB is connected
      try {
        startWhatsAppWatcher();

        console.log("WhatsApp watcher initialization requested");
      } catch (error) {
        console.error("WhatsApp watcher startup failed:", error.message);
      }
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error.message);
    });
  } catch (error) {
    console.error("Failed to start OnlineSolutionHub backend:", error.message);

    process.exit(1);
  }
}

startServer();