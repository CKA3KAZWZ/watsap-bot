import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  const message = req.body?.messages?.[0];
  if (!message) return res.sendStatus(200);

  const userText = message.text;
  const sender = message.sender;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "user", content: userText }],
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const botReply = response.data.choices[0].message.content;

    await axios.post(
      `https://api.wazzup24.com/v3/message?instanceId=${process.env.INSTANCE_ID}`,
      {
        phone: sender,
        text: botReply,
      },
      {
        headers: {
          Authorization: process.env.WAZZUP_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Ошибка бота:", error.response?.data || error.message);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Bot запущен на порту ${PORT}`));