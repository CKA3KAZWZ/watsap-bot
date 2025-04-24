const axios = require("axios");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const message = req.body?.messages?.[0];
  if (!message) return res.status(200).send("No message received");

  const userText = message.text;
  const sender = message.sender;

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

  try {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText }
      ],
      max_tokens: 300,
      temperature: 0.7
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const botReply = response.data.choices[0].message.content;

    await axios.post(`https://api.wazzup24.com/v3/message?instanceId=${process.env.INSTANCE_ID}`, {
      phone: sender,
      text: botReply
    }, {
      headers: {
        Authorization: process.env.WAZZUP_API_KEY,
        "Content-Type": "application/json"
      }
    });

    res.status(200).send("Success");
  } catch (error) {
    console.error("Ошибка:", error.response?.data || error.message);
    res.status(500).send("Error");
  }
};
