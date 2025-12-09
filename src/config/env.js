import dotenv from 'dotenv';
dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.ADMIN_CHAT_ID) {
  console.error('FATAL: TELEGRAM_BOT_TOKEN or ADMIN_CHAT_ID is not defined.');
  process.exit(1);
}

export const config = {
  port: process.env.PORT || 5000,
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  adminChatId: process.env.ADMIN_CHAT_ID,
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
};
