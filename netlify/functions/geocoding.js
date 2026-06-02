const https = require('https');

const API_KEY = process.env.VUE_APP_WEATHER_API_KEY;

function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

exports.handler = async (event) => {
  const { lat, lon, city, type } = event.queryStringParameters || {};

  try {
    let data;

    if (type === 'city' && city) {
      // Search by city name
      data = await fetchJSON(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
      );
    } else if (lat && lon) {
      if (type === 'detailed') {
        // Detailed location using Nominatim (village/commune level)
        data = await fetchJSON(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
          { 'User-Agent': 'ClimaSense/1.0', 'Accept-Language': 'en' }
        );
      } else {
        // Basic reverse geocoding via OpenWeatherMap
        data = await fetchJSON(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
        );
      }
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid parameters' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
