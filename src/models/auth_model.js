
const mongoose = require("mongoose");

const authSchema = new mongoose.Schema({
  userName: {
    type: String,
    enum: ["admin", "Employee"],
    required: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },

  loginAt: {
    type: Number,
    default: null,
  },

  logoutAt: {
    type: Number,
    default: null,
  },
});

const authModel = mongoose.model("Auth", authSchema);

module.exports = authModel;
