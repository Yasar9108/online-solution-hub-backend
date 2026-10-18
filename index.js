
const express = require("express");
const connectDb = require("./src/config/db");
const requestController = require("./src/controllers/request_conroller");
const authController = require("./src/controllers/auth_controller");    
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: [
   "https://www.onlinesolutionhub.com",
   "https://onlinesolutionhub.com",
   "http://localhost:5173"
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

// admin register and employee register route
app.post("/api/register",authController.registerUser);

// admin and employee login route
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
    await connectDb();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();
