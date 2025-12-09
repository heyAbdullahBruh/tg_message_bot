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
