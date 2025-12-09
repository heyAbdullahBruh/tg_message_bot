import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/env.js';

const bot = new TelegramBot(config.telegramToken, { polling: false });

export const sendContactNotification = async (data, geo) => {
  const { name, email, phone, message, address } = data;

  const text = `
📩 **New Website Inquiry**

👤 **User Details:**
<b>Name:</b> ${name}
<b>Email:</b> ${email}
<b>Phone:</b> ${phone}
<b>Address:</b> ${address || 'Not Provided'}

🌍 **Geo Location:**
<b>IP:</b> ${data.ip}
<b>Country:</b> ${geo.country}
<b>City:</b> ${geo.city}
<b>Coordinates:</b> ${geo.latitude}, ${geo.longitude}
<b>Map:</b> <a href="https://www.google.com/maps?q=${geo.latitude},${geo.longitude}">View Map</a>

📝 **Message:**
${message}
  `;

  try {
    await bot.sendMessage(config.adminChatId, text, { 
      parse_mode: 'HTML',
      disable_web_page_preview: true 
    });
    return true;
  } catch (error) {
    console.error('Telegram Send Error:', error.message);
    throw new Error('Failed to send Telegram message');
  }
};
