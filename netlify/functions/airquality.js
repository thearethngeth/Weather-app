const https = require('https');

const API_KEY = process.env.VUE_APP_WEATHER_API_KEY;

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

exports.handler = async (event) => {
  const { lat, lon } = event.queryStringParameters || {};

  if (!lat || !lon) {
    return { statusCode: 400, body: JSON.stringify({ error: 'lat and lon required' }) };
  }

  try {
    const data = await fetchJSON(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
