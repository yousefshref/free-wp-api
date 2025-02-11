const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios"); // Import axios for making HTTP requests

const app = express();
const port = 3000;
const WEBHOOK_URL = "http://127.0.0.1:8000/whatsapp_webhook/"; // Replace with your actual Django webhook URL

app.use(cors());
app.use(bodyParser.json());

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  console.log("📲 Scan this QR code to login:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ WhatsApp Bot is ready!");
});

// Listen for messages and send to webhook
client.on("message", async (message) => {
  if (!message.from.endsWith("@c.us")) return; // Only process @c.us messages

  console.log(`📩 New message from ${message.from}: ${message.body}`);

  // Send the message data to Django
  try {
    await axios.post(WEBHOOK_URL, {
      from: message.from,
      body: message.body,
      timestamp: new Date(message.timestamp * 1000),
    });
    console.log("✅ Message sent to webhook");
  } catch (error) {
    console.error("❌ Failed to send message to webhook:", error);
  }
});

app.get("/status", (req, res) => {
  res.json({ status: "Bot is running" });
});

app.use(express.json());
app.post("/send-message", async (req, res) => {
  const { number, message } = req.body;
  if (!number || !message) {
    return res.status(400).json({ error: "Missing number or message" });
  }

  try {
    const chatId = `${number}@c.us`;
    await client.sendMessage(chatId, message);
    res.json({ success: true, message: `📤 Message sent to ${number}` });
  } catch (error) {
    res.status(500).json({ error: "Failed to send message", details: error });
  }
});

app.get("/", (req, res) => {
  const endpoints = [
    {
      url: "/status",
      method: "GET",
      description: "Check if the bot is running",
    },
    {
      url: "/send-message",
      method: "POST",
      description: "Send a message to a WhatsApp number",
      body: {
        number: "The WhatsApp number to send the message to",
        message: "The message to be sent",
      },
    },
  ];

  res.json(endpoints);
});

app.listen(port, () => {
  console.log(`🚀 API server running on http://localhost:${port}`);
});

client.initialize();
