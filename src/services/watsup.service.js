const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcodeTerminal = require("qrcode-terminal");
const QRCode = require("qrcode");

const LOG_TAG = "[WhatsApp Service] ==>";

// On Render, set WA_SESSION_PATH to a persistent disk path, e.g. /var/data/wa-session
const SESSION_PATH = process.env.WA_SESSION_PATH || "./.wwebjs_auth";

// Optional: set PUPPETEER_EXECUTABLE_PATH if Chrome is installed somewhere custom
const EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

let client = null;
let status = "stopped"; // stopped | initializing | qr | authenticated | ready | disconnected | auth_failure
let lastQr = null;
let reconnectTimer = null;

function createClient() {
    const instance = new Client({
        authStrategy: new LocalAuth({
            clientId: "onlinesolutionhub",
            dataPath: SESSION_PATH,
        }),
        puppeteer: {
            headless: true,
            executablePath: EXECUTABLE_PATH,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-zygote",
                "--disable-extensions",
            ],
        },
    });

    instance.on("qr", (qr) => {
        status = "qr";
        lastQr = qr;
        console.log(LOG_TAG, "Scan with your business WhatsApp:");
        qrcodeTerminal.generate(qr, { small: true });
    });

    instance.on("authenticated", () => {
        status = "authenticated";
        lastQr = null;
        console.log(LOG_TAG, "WhatsApp authenticated");
    });

    instance.on("ready", () => {
        status = "ready";
        lastQr = null;
        console.log(LOG_TAG, "WhatsApp connected successfully!");
    });

    instance.on("auth_failure", (message) => {
        status = "auth_failure";
        console.error(LOG_TAG, "Authentication failed:", message);
        scheduleRestart();
    });

    instance.on("disconnected", (reason) => {
        status = "disconnected";
        console.warn(LOG_TAG, "WhatsApp disconnected:", reason);
        scheduleRestart();
    });

    return instance;
}

async function startClient() {
    client = createClient();
    status = "initializing";

    try {
        await client.initialize();
    } catch (error) {
        status = "stopped";
        console.error(LOG_TAG, "Initialization failed:", error.message);
        scheduleRestart();
    }
}

function scheduleRestart() {
    if (reconnectTimer) return;

    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;
        console.log(LOG_TAG, "Restarting WhatsApp client...");

        try {
            if (client) await client.destroy();
        } catch (error) {
            // Ignore errors while closing the old browser
        }

        client = null;
        startClient();
    }, 15000);
}

function initializeWhatsApp() {
    if (client) return;
    startClient();
}

function getWhatsAppStatus() {
    return status;
}

// Returns a PNG data URL of the current QR code, or null if none is pending
async function getWhatsAppQrDataUrl() {
    if (!lastQr) return null;
    return QRCode.toDataURL(lastQr, { margin: 2, width: 320 });
}

async function sendWhatsAppMessage(phoneNumber, message) {
    if (status !== "ready" || !client) {
        throw new Error("WhatsApp is not connected yet");
    }

    let number = String(phoneNumber || "").replace(/\D/g, "");

    // 10-digit numbers are treated as Indian
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

module.exports = {
    initializeWhatsApp,
    sendWhatsAppMessage,
    getWhatsAppStatus,
    getWhatsAppQrDataUrl,
};