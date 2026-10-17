
require("dotenv").config();

const mongoose = require("mongoose");
const Request = require("./models/request_model");

const {
    initializeWhatsApp,
    sendWhatsAppMessage,
    getWhatsAppStatus
} = require("./services/watsup.service");

const LOG_TAG = "[WhatsApp Watcher] ==>";

const POLL_INTERVAL = 10000;
const processedRequestIds = new Set();

let isChecking = false;
let pollIntervalId = null;

// Keys must exactly match requestType values in MongoDB.
const SERVICE_LINKS = {
    "Ration Card":
        "https://play.google.com/store/apps/details?id=in.gov.karnataka.ahara.annaseva",

    "RATION CARD e-KYC":
        "https://play.google.com/store/apps/details?id=in.gov.karnataka.ahara.annaseva"
};

function createCustomerMessage(request) {
    const serviceLink = SERVICE_LINKS[request.requestType];

    if (!serviceLink) {
        console.warn(
            LOG_TAG,
            "Configure a verified link for:",
            request.requestType
        );

        return null;
    }

 
function createCustomerMessage(request) {
    return [
        "Hi from OSH Team! 👋",
        "",
        "Your payment has been accepted by OnlineSolutionHub.",
        `Service: ${request.requestType}`,
        `Request ID: ${request._id}`,
        "",
        "📱 ANDROID APP:",
        "Download Anna Seve here:",
        "https://play.google.com/store/apps/details?id=in.gov.karnataka.ahara.annaseva",
        "",
        " IPHONE APP:",
        "Check the Apple App Store here:",
        "https://apps.apple.com/in/search?term=Anna%20Seve",
        "",
        "If you need assistance with ration card e-KYC, please contact Team OSH.",
        "",
        "Thank you for choosing OnlineSolutionHub! ❤️"
    ].join("\n");
}

}

async function checkAcceptedRequests() {
    if (isChecking || getWhatsAppStatus() !== "ready") {
        return;
    }

    isChecking = true;

    try {
        const requests = await Request.find({
            paymentStatus: "Accepted"
        }).lean();

        for (const request of requests) {
            const requestId = String(request._id);

            if (processedRequestIds.has(requestId)) {
                continue;
            }

            const message = createCustomerMessage(request);

            if (!message) {
                continue;
            }

            // Prevent duplicate attempts during this process session.
            processedRequestIds.add(requestId);

            try {
                await sendWhatsAppMessage(
                    request.phoneNumber,
                    message
                );

                console.log(
                    LOG_TAG,
                    "Message sent for request:",
                    requestId
                );
            } catch (error) {
                processedRequestIds.delete(requestId);

                console.error(
                    LOG_TAG,
                    "Message failed for request:",
                    requestId,
                    error.message
                );
            }
        }
    } catch (error) {
        console.error(
            LOG_TAG,
            "Database check failed:",
            error.message
        );
    } finally {
        isChecking = false;
    }
}

async function startWatcher() {
    // Keep MONGOOSE_KEY if this is the variable in your .env.
    if (!process.env.MONGOOSE_KEY) {
        throw new Error("MONGOOSE_KEY is missing from .env");
    }

    await mongoose.connect(process.env.MONGOOSE_KEY);

    console.log(LOG_TAG, "MongoDB connected");

    initializeWhatsApp();

    const waitForConnection = setInterval(() => {
        if (getWhatsAppStatus() !== "ready") {
            console.log(LOG_TAG, "Waiting for WhatsApp...");
            return;
        }

        clearInterval(waitForConnection);

        console.log(LOG_TAG, "WhatsApp ready");
        console.log(LOG_TAG, "Watching accepted payments");

        checkAcceptedRequests();

        pollIntervalId = setInterval(
            checkAcceptedRequests,
            POLL_INTERVAL
        );
    }, 5000);
}

startWatcher().catch((error) => {
    console.error(
        LOG_TAG,
        "Startup failed:",
        error.message
    );

    process.exit(1);
});

process.on("SIGINT", async () => {
    console.log(LOG_TAG, "Shutting down...");

    if (pollIntervalId) {
        clearInterval(pollIntervalId);
    }

    await mongoose.disconnect();

    process.exit(0);
});
