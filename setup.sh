#!/bin/bash

echo "🚀 Initializing Best Telegram Bot Project..."

# 1. Create Directory Structure
mkdir -p src/config
mkdir -p src/controllers
mkdir -p src/middleware
mkdir -p src/routes
mkdir -p src/services

# 2. Initialize Node Project
echo '{
  "name": "tg-contact-bot",
  "version": "1.0.0",
  "description": "Telegram Contact Form Bot",
  "main": "src/app.js",
  "type": "module",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}' > package.json

# 3. Create .env file
cat <<EOF > .env
PORT=5000
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_CHAT_ID=your_chat_id_here
ALLOWED_ORIGINS=http://localhost:3000,http://yourdomain.com
EOF

# 4. Create src/config/env.js
cat <<EOF > src/config/env.js
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
EOF

# 5. Create src/services/geo.service.js
cat <<EOF > src/services/geo.service.js
import axios from 'axios';

export const getGeoInfo = async (ip) => {
  try {
    if (ip === '::1' || ip === '127.0.0.1') {
      return { country: 'Localhost', city: 'Localhost', latitude: 0, longitude: 0 };
    }
    
    // Using ipwho.is (free, no key required)
    const response = await axios.get(\`http://ipwho.is/\${ip}\`);
    
    if (!response.data.success) {
      return defaultGeo();
    }

    return {
      country: response.data.country || 'Unknown',
      city: response.data.city || 'Unknown',
      latitude: response.data.latitude || 0,
      longitude: response.data.longitude || 0
    };
  } catch (error) {
    console.error('Geo API Error:', error.message);
    return defaultGeo();
  }
};

const defaultGeo = () => ({
  country: 'Unknown',
  city: 'Unknown',
  latitude: 'N/A',
  longitude: 'N/A'
});
EOF

# 6. Create src/services/telegram.service.js
cat <<EOF > src/services/telegram.service.js
import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/env.js';

const bot = new TelegramBot(config.telegramToken, { polling: false });

export const sendContactNotification = async (data, geo) => {
  const { name, email, phone, message, address } = data;

  const text = \`
📩 **New Website Inquiry**

👤 **User Details:**
<b>Name:</b> \${name}
<b>Email:</b> \${email}
<b>Phone:</b> \${phone}
<b>Address:</b> \${address || 'Not Provided'}

🌍 **Geo Location:**
<b>IP:</b> \${data.ip}
<b>Country:</b> \${geo.country}
<b>City:</b> \${geo.city}
<b>Coordinates:</b> \${geo.latitude}, \${geo.longitude}
<b>Map:</b> <a href="https://www.google.com/maps?q=\${geo.latitude},\${geo.longitude}">View Map</a>

📝 **Message:**
\${message}
  \`;

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
EOF

# 7. Create src/middleware/validation.js
cat <<EOF > src/middleware/validation.js
import { body, validationResult } from 'express-validator';

export const validateContact = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('message').trim().notEmpty().withMessage('Message is required').escape(),
  body('address').optional().trim().escape(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];
EOF

# 8. Create src/controllers/contact.controller.js
cat <<EOF > src/controllers/contact.controller.js
import requestIp from 'request-ip';
import { getGeoInfo } from '../services/geo.service.js';
import { sendContactNotification } from '../services/telegram.service.js';

export const handleContactForm = async (req, res) => {
  try {
    const clientIp = requestIp.getClientIp(req); 
    
    const formData = {
      ...req.body,
      ip: clientIp
    };

    const geoData = await getGeoInfo(clientIp);
    await sendContactNotification(formData, geoData);

    return res.status(200).json({
      success: true,
      message: 'Inquiry received successfully.'
    });

  } catch (error) {
    console.error('Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};
EOF

# 9. Create src/routes/contact.routes.js
cat <<EOF > src/routes/contact.routes.js
import express from 'express';
import { handleContactForm } from '../controllers/contact.controller.js';
import { validateContact } from '../middleware/validation.js';

const router = express.Router();

router.post('/contact', validateContact, handleContactForm);

export default router;
EOF

# 10. Create src/app.js
cat <<EOF > src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import contactRoutes from './routes/contact.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.allowedOrigins,
  methods: ['POST'],
  credentials: true
}));

app.use(express.json());

app.use('/api', contactRoutes);

app.get('/', (req, res) => {
  res.send('Telegram Contact Bot API is Running 🚀');
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.listen(config.port, () => {
  console.log(\`Server running on port \${config.port}\`);
});
EOF

# 11. Install Dependencies
echo "📦 Installing Dependencies..."
npm install express cors helmet dotenv node-telegram-bot-api axios express-validator request-ip
npm install --save-dev nodemon

echo "✅ Setup Complete!"
echo "➡️  1. Open .env and add your TELEGRAM_BOT_TOKEN and ADMIN_CHAT_ID"
echo "➡️  2. Run 'npm run dev' to start"
EOF