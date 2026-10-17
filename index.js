
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDb = require("./src/config/db");

const requestController = require("./src/controllers/request_conroller");
const authController = require("./src/controllers/auth_controller");

const {
  startWhatsAppWatcher,
} = require("./src/whatsapp");

const app = express();

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

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "OnlineSolutionHub backend is running",
  });
});

// Create service request
app.post("/api/request", requestController.createRequest);

// Get all requests
app.get("/api/getRequests", requestController.getAllRequests);

// Update request
app.patch(
  "/api/updateRequest/:id",
  requestController.updateRequest
);

// Delete request
app.delete(
  "/api/deleteRequest/:id",
  requestController.deleteRequest
);

// Admin registration
app.post("/api/register", authController.registerUser);

// Admin login
app.post("/api/login", authController.loginUser);

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to MongoDB first
    await connectDb();

    console.log("MongoDB connected successfully");

    // Start the API server
    const server = app.listen(PORT, () => {
      console.log(
        `OnlineSolutionHub backend is running on port ${PORT}`
      );

      // Start WhatsApp watcher after MongoDB is connected
      try {
        startWhatsAppWatcher();

        console.log("WhatsApp watcher initialization requested");
      } catch (error) {
        console.error(
          "WhatsApp watcher startup failed:",
          error.message
        );
      }
    });

    // Handle unexpected server errors
    server.on("error", (error) => {
      console.error("HTTP server error:", error.message);
    });
  } catch (error) {
    console.error(
      "Failed to start OnlineSolutionHub backend:",
      error.message
    );

    process.exit(1);
  }
}

startServer();
