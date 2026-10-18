const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    if (!process.env.MONGOOSE_KEY) {
      throw new Error("MONGOOSE_KEY is missing from .env");
    }

    await mongoose.connect(process.env.MONGOOSE_KEY);

    console.log("Database connected successfully");

    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDb;