import TelegramBot from "node-telegram-bot-api";
import { config } from "../config/env.js";

// Initialize Bot
const bot = new TelegramBot(config.telegramToken, {
  polling: false,
  request: {
    timeout: 20000,
    headers: { "User-Agent": "Telegram-Contact-Bot/2.0" },
  },
});

const escapeHTML = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

/**
 * 🎧 Event Listener for Button Clicks (Analytics)
 * Prevents the button from "spinning" forever
 */
bot.on("callback_query", async (query) => {
  if (query.data === "view_analytics") {
    // Just a dummy response to stop the spinner
    await bot.answerCallbackQuery(query.id, {
      text: "📊 Analytics feature coming soon!",
      show_alert: true,
    });
  }
});

export const sendContactNotification = async (data, geo) => {
  const { name, email, phone, message, address } = data;

  // 1. Safe Formatting for Timestamp
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: geo.timezone || "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const stopBot = () => {
    if (bot.isPolling()) {
      console.log("🛑 Stopping Telegram Bot polling...");
      bot.stopPolling();
    }
  };
  process.once("SIGINT", stopBot);
  process.once("SIGTERM", stopBot);
  // 2. Helper for Emoji
  const getCountryEmoji = (code) => {
    if (!code) return "🌍";
    // Offset char code calculation for flags (Modern JS trick)
    return code
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(char.charCodeAt(0) + 127397)
      );
  };

  // 3. Format Maps URL
  const getMapsUrl = (lat, lng) =>
    lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  // 4. Build The Message (Using escapeHTML on ALL user inputs)
  const text = `
🎯 <b>🚀 NEW WEBSITE INQUIRY</b>

⏰ <b>Time:</b> <code>${timestamp}</code>
📋 <b>Ref:</b> <code>#${Date.now().toString().slice(-6)}</code>

━━━━━━━━━━━━━━━━━━━━

👤 <b>USER DETAILS</b>
├ <b>Name:</b> <code>${escapeHTML(name)}</code>
├ <b>Email:</b> <code>${escapeHTML(email)}</code>
├ <b>Phone:</b> <code>${escapeHTML(phone)}</code>
└ <b>Addr:</b> ${address ? escapeHTML(address) : "<i>N/A</i>"}

━━━━━━━━━━━━━━━━━━━━

${getCountryEmoji(geo.country_code)} <b>LOCATION INFO</b>
├ <b>IP:</b> <code>${data.ip}</code>
├ <b>City:</b> ${escapeHTML(geo.city)}, ${escapeHTML(geo.country)}
├ <b>ISP:</b> ${escapeHTML(geo.isp)}
${
  geo.latitude
    ? `└ <b>Map:</b> <a href="${getMapsUrl(
        geo.latitude,
        geo.longitude
      )}">Open Google Maps</a>`
    : ""
}

━━━━━━━━━━━━━━━━━━━━

💬 <b>MESSAGE</b>
<i>${escapeHTML(message)}</i>

━━━━━━━━━━━━━━━━━━━━
  `.trim();

  try {
    // 5. Send Main Message
    const sentMessage = await bot.sendMessage(config.adminChatId, text, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📧 Email User", url: `mailto:${email}` },
            { text: "📱 Call User", url: `tel:${phone}` },
          ],
          [
            { text: "📊 View Analytics", callback_data: "view_analytics" }, // Now works because of listener above
          ],
        ],
      },
    });

    // 6. Send Sticker (Silent fail if invalid)
    try {
      const stickers = [
        "CAACAgIAAxkBAAIBmmWqJqMnM7UzB6MgoWewNwFoyDRGAAIBAAPANk8Tm1Hh7IQOnqgvBA", // Standard Telegram Sticker
      ];
      await bot.sendSticker(config.adminChatId, stickers[0], {
        disable_notification: true,
      });
    } catch (e) {
      /* Ignore sticker errors */
    }

    return { success: true, id: sentMessage.message_id };
  } catch (error) {
    console.error("❌ Rich Message Failed:", error.message);

    // 🌟 CRITICAL FIX: Fallback must NOT use HTML parsing
    // This ensures you receive the lead even if the fancy formatting fails
    const fallbackText = `
🚨 FORMATTING ERROR - RAW DATA
Name: ${name}
Email: ${email}
Phone: ${phone}
Message: ${message}
Location: ${geo.country} (${data.ip})
    `;

    try {
      await bot.sendMessage(config.adminChatId, fallbackText); // No parse_mode = Safe
      return { success: true, fallback: true };
    } catch (fatalError) {
      console.error("❌ Total Delivery Failure");
      throw new Error("Telegram unreachable");
    }
  }
};

// Export Utils
export const telegramUtils = {
  escapeHTML,
  testBotConnection: async () => {
    const me = await bot.getMe();
    return { connected: true, bot: me.username };
  },
};
