import axios from "axios";

export const getGeoInfo = async (ip) => {
  try {
    // Localhost handling
    if (ip === "::1" || ip === "127.0.0.1") {
      return {
        country: "Localhost",
        country_code: "US", // Default for testing emoji
        city: "Localhost",
        latitude: 0,
        longitude: 0,
        timezone: "UTC",
        isp: "Local Dev",
        asn: "N/A",
      };
    }

    const response = await axios.get(`http://ipwho.is/${ip}`);

    if (!response.data.success) {
      return defaultGeo();
    }

    // 🌟 We now return ALL the data your new bot code needs
    return {
      country: response.data.country || "Unknown",
      country_code: response.data.country_code || "UN", // Needed for Emoji map
      city: response.data.city || "Unknown",
      region: response.data.region || "",
      postal: response.data.postal || "",
      latitude: response.data.latitude || 0,
      longitude: response.data.longitude || 0,
      timezone: response.data.timezone?.id || "UTC",
      isp: response.data.connection?.isp || "Unknown",
      asn: response.data.connection?.asn || "",
    };
  } catch (error) {
    console.error("Geo API Error:", error.message);
    return defaultGeo();
  }
};

const defaultGeo = () => ({
  country: "Unknown",
  country_code: "UN",
  city: "Unknown",
  latitude: 0,
  longitude: 0,
  timezone: "UTC",
  isp: "Unknown",
});
