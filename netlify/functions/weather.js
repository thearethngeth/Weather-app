const https = require('https');

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

  const params = [
    `latitude=${lat}`,
    `longitude=${lon}`,
    `current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility,cloud_cover,is_day`,
    `hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl`,
    `daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,weather_code`,
    `timezone=auto`,
    `forecast_days=7`,
    `wind_speed_unit=kmh`
  ].join('&');

  try {
    const data = await fetchJSON(`https://api.open-meteo.com/v1/forecast?${params}`);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
