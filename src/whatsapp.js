const mongoose = require("mongoose");
const Request = require("./models/request_model");

const {
  initializeWhatsApp,
  sendWhatsAppMessage,
  getWhatsAppStatus,
} = require("./services/watsup.service");

const LOG_TAG = "[WhatsApp Watcher] ==>";

const POLL_INTERVAL = 10000;
const MAX_ATTEMPTS = 3;

let isChecking = false;
let pollIntervalId = null;
let readyCheckId = null;
let started = false;

function isRationCardService(requestType) {
  return /ration|anna/i.test(String(requestType || ""));
}

function createCustomerMessage(request) {
  const lines = [
    "Hi from OSH Team! 👋",
    "",
    "Your payment has been accepted by OnlineSolutionHub.",
    `Service: ${request.requestType}`,
    `Request ID: ${request._id}`,
    "",
  ];

  if (isRationCardService(request.requestType)) {
    lines.push(
      "📱 ANDROID APP:",
      "Download Anna Seve here:",
      "https://play.google.com/store/apps/details?id=in.gov.karnataka.ahara.annaseva",
      "",
      "🍎 IPHONE APP:",
      "Find Anna Seve on the App Store:",
      "https://apps.apple.com/in/search?term=Anna%20Seve",
      "",
      "If you need assistance with ration card e-KYC, please contact Team OSH.",
      ""
    );
  } else {
    lines.push(
      "Our team will contact you shortly with the next steps for your request.",
      ""
    );
  }

  lines.push("Thank you for choosing OnlineSolutionHub! ❤️");

  return lines.join("\n");
}

async function checkAcceptedRequests() {
  if (isChecking || getWhatsAppStatus() !== "ready") {
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    console.warn(LOG_TAG, "MongoDB is not connected");
    return;
  }

  isChecking = true;

  try {
    // Only requests that were never messaged and have not failed too often
    const requests = await Request.find({
      paymentStatus: "Accepted",
      whatsappSentAt: null,
      whatsappAttempts: { $not: { $gte: MAX_ATTEMPTS } },
    }).lean();

    for (const request of requests) {
      const requestId = String(request._id);

      if (!request.phoneNumber) {
        console.error(LOG_TAG, "Missing phone number for request:", requestId);
        continue;
      }

      // Claim the request first so it can never be sent twice
      const claimed = await Request.findOneAndUpdate(
        { _id: request._id, whatsappSentAt: null },
        { $set: { whatsappSentAt: new Date() } }
      );

      if (!claimed) {
        continue;
      }

      try {
        await sendWhatsAppMessage(
          request.phoneNumber,
          createCustomerMessage(request)
        );

        console.log(LOG_TAG, "WhatsApp message sent for request:", requestId);
      } catch (error) {
        // Release the claim and count the failed attempt
        await Request.updateOne(
          { _id: request._id },
          {
            $set: { whatsappSentAt: null },
            $inc: { whatsappAttempts: 1 },
          }
        );

        console.error(
          LOG_TAG,
          "Message failed for request:",
          requestId,
          error.message
        );
      }
    }
  } catch (error) {
    console.error(LOG_TAG, "Database check failed:", error.message);
  } finally {
    isChecking = false;
  }
}

function startWhatsAppWatcher() {
  if (started) {
    console.log(LOG_TAG, "Watcher already started");
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error(
      "MongoDB must be connected before starting WhatsApp watcher"
    );
  }

  started = true;

  console.log(LOG_TAG, "Using existing MongoDB connection");

  initializeWhatsApp();

  // Poll continuously; checkAcceptedRequests skips while WhatsApp is not ready,
  // so this also recovers automatically after a reconnect.
  readyCheckId = setInterval(() => {
    if (getWhatsAppStatus() === "ready") {
      console.log(LOG_TAG, "WhatsApp ready, watching accepted payments");

      clearInterval(readyCheckId);
      readyCheckId = null;

      checkAcceptedRequests();
    }
  }, 3000);

  pollIntervalId = setInterval(checkAcceptedRequests, POLL_INTERVAL);
}

function stopWhatsAppWatcher() {
  if (readyCheckId) {
    clearInterval(readyCheckId);
    readyCheckId = null;
  }

  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }

  started = false;
}

module.exports = {
  startWhatsAppWatcher,
  stopWhatsAppWatcher,
};