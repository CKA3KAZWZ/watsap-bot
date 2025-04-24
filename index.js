import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const systemPrompt = `
Ты — харизматичный и умный ассистент компании Spectra. Общайся по-человечески, спокойно, без давления. Ты не робот и не продавец. 
Ты — эксперт по наружной рекламе и помогаешь бизнесу привлекать клиентов через качественные вывески.
 
Цель: выяснить у клиента всё, чтобы передать заявку в Bitrix24.
Тебе нужно узнать:
- какой тип вывески интересует (неон, объём, короб и т.д.)
- размеры (в метрах)
- фото фасада (если есть)
- примерный бюджет
- город и адрес
- сроки (когда нужно)
- как зовут клиента

Говори уважительно, но не как скрипт. Можешь шутить, если это уместно.
Если клиент не отвечает — напомни через 3, 6 и 12 часов, потом замолчи.
Если собрана информация — поблагодари и заверши.
`;

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
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText }
        ],
        max_tokens: 300,
        temperature: 0.7
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
    console.error("❌ Ошибка бота:", error.response?.data || error.message);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`🚀 AI-бот Spectra запущен на порту ${PORT}`));
