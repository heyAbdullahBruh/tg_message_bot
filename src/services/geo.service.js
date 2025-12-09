import axios from 'axios';

export const getGeoInfo = async (ip) => {
  try {
    if (ip === '::1' || ip === '127.0.0.1') {
      return { country: 'Localhost', city: 'Localhost', latitude: 0, longitude: 0 };
    }
    
    // Using ipwho.is (free, no key required)
    const response = await axios.get(`http://ipwho.is/${ip}`);
    
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
