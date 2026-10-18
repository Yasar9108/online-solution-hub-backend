
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const LOG_TAG = "[WhatsApp Service] ==>";

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "onlinesolutionhub"
    }),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
});

let isReady = false;
let isInitializing = false;

client.on("qr", (qr) => {
    console.log(LOG_TAG, "Scan with your business WhatsApp:");
    qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
    console.log(LOG_TAG, "WhatsApp authenticated");
});

client.on("ready", () => {
    isReady = true;
    isInitializing = false;
    console.log(LOG_TAG, "WhatsApp connected successfully!");
});

client.on("auth_failure", (message) => {
    isReady = false;
    isInitializing = false;
    console.error(LOG_TAG, "Authentication failed:", message);
});

client.on("disconnected", (reason) => {
    isReady = false;
    isInitializing = false;
    console.warn(LOG_TAG, "WhatsApp disconnected:", reason);
});

async function sendWhatsAppMessage(phoneNumber, message) {
    if (!isReady) {
        throw new Error("WhatsApp is not connected yet");
    }

    let number = String(phoneNumber || "").replace(/\D/g, "");

    // Assumes a 10-digit number is Indian.
    if (number.length === 10) {
        number = `91${number}`;
    }

    if (!/^\d{10,15}$/.test(number)) {
        throw new Error("Invalid phone number");
    }

    const numberId = await client.getNumberId(number);

    if (!numberId) {
        throw new Error("This number is not registered on WhatsApp");
    }

    return client.sendMessage(numberId._serialized, message);
}

function initializeWhatsApp() {
    if (isReady || isInitializing) {
        return;
    }

    isInitializing = true;

    client.initialize().catch((error) => {
        isInitializing = false;
        console.error(LOG_TAG, "Initialization failed:", error.message);
    });
}

function getWhatsAppStatus() {
    return isReady ? "ready" : "not_ready";
}

module.exports = {
    initializeWhatsApp,
    sendWhatsAppMessage,
    getWhatsAppStatus
};
