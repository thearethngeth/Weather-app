import axios from 'axios';

// Use backend function in production, direct API in local dev
const BASE_URL = process.env.NODE_ENV === 'production'
  ? '/.netlify/functions/weather'
  : 'https://api.open-meteo.com/v1/forecast';

// WMO weather code → { description, main, icon (OWM-compatible) }
const WMO_CODES = {
  0:  { description: 'clear sky',          main: 'Clear',       icon: '01d' },
  1:  { description: 'mainly clear',       main: 'Clear',       icon: '01d' },
  2:  { description: 'partly cloudy',      main: 'Clouds',      icon: '02d' },
  3:  { description: 'overcast clouds',    main: 'Clouds',      icon: '04d' },
  45: { description: 'foggy',              main: 'Fog',         icon: '50d' },
  48: { description: 'icy fog',            main: 'Fog',         icon: '50d' },
  51: { description: 'light drizzle',      main: 'Drizzle',     icon: '09d' },
  53: { description: 'moderate drizzle',   main: 'Drizzle',     icon: '09d' },
  55: { description: 'heavy drizzle',      main: 'Drizzle',     icon: '09d' },
  61: { description: 'light rain',         main: 'Rain',        icon: '10d' },
  63: { description: 'moderate rain',      main: 'Rain',        icon: '10d' },
  65: { description: 'heavy rain',         main: 'Rain',        icon: '10d' },
  71: { description: 'light snow',         main: 'Snow',        icon: '13d' },
  73: { description: 'moderate snow',      main: 'Snow',        icon: '13d' },
  75: { description: 'heavy snow',         main: 'Snow',        icon: '13d' },
  77: { description: 'snow grains',        main: 'Snow',        icon: '13d' },
  80: { description: 'light showers',      main: 'Rain',        icon: '09d' },
  81: { description: 'moderate showers',   main: 'Rain',        icon: '09d' },
  82: { description: 'heavy showers',      main: 'Rain',        icon: '09d' },
  85: { description: 'light snow showers', main: 'Snow',        icon: '13d' },
  86: { description: 'heavy snow showers', main: 'Snow',        icon: '13d' },
  95: { description: 'thunderstorm',       main: 'Thunderstorm',icon: '11d' },
  96: { description: 'thunderstorm with hail', main: 'Thunderstorm', icon: '11d' },
  99: { description: 'heavy thunderstorm', main: 'Thunderstorm',icon: '11d' },
};

function getWeatherInfo(code, isDay = true) {
  const info = WMO_CODES[code] || { description: 'unknown', main: 'Unknown', icon: '01d' };
  const icon = isDay ? info.icon : info.icon.replace('d', 'n');
  return { ...info, icon };
}

// Convert Open-Meteo response → OpenWeatherMap-compatible current weather format
export function mapCurrentWeather(data, locationName, country) {
  const c = data.current;
  const isDay = c.is_day ?? 1;
  const wInfo = getWeatherInfo(c.weather_code, isDay);

  return {
    name: locationName || 'Unknown',
    sys: { country: country || '', sunrise: 0, sunset: 0 },
    main: {
      temp: c.temperature_2m,
      feels_like: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      pressure: c.pressure_msl || 1013,
      temp_min: data.daily?.temperature_2m_min?.[0] ?? c.temperature_2m,
      temp_max: data.daily?.temperature_2m_max?.[0] ?? c.temperature_2m,
    },
    weather: [{ id: c.weather_code, main: wInfo.main, description: wInfo.description, icon: wInfo.icon }],
    wind: { speed: Math.round(c.wind_speed_10m / 3.6 * 10) / 10, deg: c.wind_direction_10m },  // km/h → m/s
    visibility: (c.visibility ?? 10000),
    clouds: { all: c.cloud_cover ?? 0 },
    rain: c.precipitation > 0 ? { '1h': c.precipitation } : undefined,
    _source: 'open-meteo'
  };
}

// Convert Open-Meteo hourly → OpenWeatherMap forecast list format
export function mapForecast(data) {
  const hourly = data.hourly;
  const list = [];

  for (let i = 0; i < Math.min(hourly.time.length, 168); i++) {
    const wInfo = getWeatherInfo(hourly.weather_code[i]);
    list.push({
      dt: new Date(hourly.time[i]).getTime() / 1000,
      dt_txt: hourly.time[i].replace('T', ' '),
      main: {
        temp: hourly.temperature_2m[i],
        feels_like: hourly.apparent_temperature[i],
        humidity: hourly.relative_humidity_2m[i],
        pressure: hourly.pressure_msl?.[i] ?? 1013,
        temp_min: hourly.temperature_2m[i],
        temp_max: hourly.temperature_2m[i],
      },
      weather: [{ id: hourly.weather_code[i], main: wInfo.main, description: wInfo.description, icon: wInfo.icon }],
      wind: { speed: Math.round(hourly.wind_speed_10m[i] / 3.6 * 10) / 10, deg: hourly.wind_direction_10m?.[i] ?? 0 },
      pop: (hourly.precipitation_probability[i] ?? 0) / 100,
      rain: hourly.precipitation[i] > 0 ? { '3h': hourly.precipitation[i] } : undefined,
    });
  }

  return { list, _source: 'open-meteo' };
}

export async function fetchOpenMeteoWeather(lat, lon) {
  const response = await axios.get(BASE_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      current: [
        'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
        'precipitation', 'weather_code', 'wind_speed_10m', 'wind_direction_10m',
        'pressure_msl', 'visibility', 'cloud_cover', 'is_day'
      ].join(','),
      hourly: [
        'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
        'precipitation', 'precipitation_probability', 'weather_code',
        'wind_speed_10m', 'wind_direction_10m', 'pressure_msl'
      ].join(','),
      daily: [
        'temperature_2m_max', 'temperature_2m_min',
        'precipitation_sum', 'precipitation_probability_max',
        'wind_speed_10m_max', 'uv_index_max', 'weather_code'
      ].join(','),
      timezone: 'auto',
      forecast_days: 7,
      wind_speed_unit: 'kmh'
    }
  });
  return response.data;
}
