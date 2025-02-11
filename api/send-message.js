const { Client, LocalAuth } = require("whatsapp-web.js");

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.initialize();

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

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
};
