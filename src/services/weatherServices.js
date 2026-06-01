// src/services/weatherServices.js
import axios from 'axios';

// Check for the API key in different places
const API_KEY = process.env.VUE_APP_WEATHER_API_KEY || "16d7ffb7b81c1a8b609196ddd5bc6470"; 
console.log('Using Weather API Key:', API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'MISSING API KEY');

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0'; // Changed to HTTPS
const ONE_CALL_URL = 'https://api.openweathermap.org/data/2.5/onecall'; // Using 2.5 version which is more widely available
const GOOGLE_MAPS_API_KEY = process.env.VUE_APP_GOOGLE_MAPS_API_KEY;

export const weatherService = {  async getCoordinatesByCity(city) {
    try {
      console.log('Fetching coordinates for city:', city);
      const response = await axios.get(`${GEO_URL}/direct`, {
        params: {
          q: city,
          limit: 1,
          appid: API_KEY
        }
      });
      console.log('City coordinates response:', response.data);
      if (!response.data || response.data.length === 0) {
        console.error('No results found for city:', city);
        return null;
      }
      return response.data[0];
    } catch (error) {
      console.error('Error fetching city coordinates:', error);
      throw new Error(`Failed to fetch city coordinates: ${error.message}`);
    }
  },
  async getReverseGeocoding(lat, lon) {
    try {
      console.log('Fetching reverse geocoding for:', lat, lon);
      const response = await axios.get(`${GEO_URL}/reverse`, {
        params: {
          lat,
          lon,
          limit: 1,
          appid: API_KEY
        }
      });
      console.log('Reverse geocoding response:', response.data);
      
      if (!response.data || response.data.length === 0) {
        // If we don't get a proper location name, create a simple one from coordinates
        console.warn('No location data returned, using coordinates');
        return {
          name: `Location`,
          country: `(${lat.toFixed(2)}, ${lon.toFixed(2)})`,
          state: null
        };
      }
      
      return response.data[0];
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      // Return a fallback location object using coordinates
      return {
        name: `Location`,
        country: `(${lat.toFixed(2)}, ${lon.toFixed(2)})`,
        state: null
      };
    }
  },
  async getDetailedLocation(lat, lon) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: { lat, lon, format: 'json', addressdetails: 1 },
        headers: { 'Accept-Language': 'en', 'User-Agent': 'ClimaSense/1.0' }
      });

      if (!response.data || !response.data.address) return null;

      const a = response.data.address;
      const village  = a.village || a.neighbourhood || a.quarter || null;
      const commune  = a.suburb || a.city_district || null;
      const district = a.county || null;
      const city     = a.city || a.town || a.state || null;
      const country  = a.country || null;

      const parts = [village, commune, district, city, country].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : null;
    } catch (error) {
      console.error('Error in detailed geocoding:', error);
      return null;
    }
  },
  async getCurrentWeather(lat, lon, units = 'metric') {
    try {
      console.log('Fetching current weather for:', lat, lon, units);
      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          units,
          appid: API_KEY
        }
      });
      console.log('Current weather response:', response.status);
      return response.data;
    } catch (error) {
      console.error('Error fetching current weather:', error.response ? error.response.data : error.message);
      throw new Error(`Failed to fetch current weather: ${error.message}`);
    }
  },

  async getForecast(lat, lon, units = 'metric') {
    try {
      const response = await axios.get(`${BASE_URL}/forecast`, {
        params: {
          lat,
          lon,
          units,
          appid: API_KEY
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch forecast');
    }
  },

  async getAirQuality(lat, lon) {
    try {
      const response = await axios.get(`${BASE_URL}/air_pollution`, {
        params: {
          lat,
          lon,
          appid: API_KEY
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch air quality');
    }
  },  async getOneCallData(lat, lon, units = 'metric') {
    try {
      console.log('Fetching One Call data for:', lat, lon, units);
      // Include the API key in the URL directly as well, in case needed
      const url = `${ONE_CALL_URL}?lat=${lat}&lon=${lon}&units=${units}&exclude=minutely&appid=${API_KEY}`;
      console.log('One Call API URL:', url);
      
      const response = await axios.get(ONE_CALL_URL, {
        params: {
          lat,
          lon,
          units,
          exclude: 'minutely', // Exclude minutely data to reduce API response size
          appid: API_KEY
        }
      });
      console.log('One Call API response status:', response.status);
      return response.data;
    } catch (error) {
      console.error('Error fetching One Call data:', error.response ? {
        status: error.response.status,
        data: error.response.data
      } : error.message);
      
      // Fall back to standard current weather and daily forecast if one call fails
      console.log('Attempting fallback to standard APIs');
      try {
        const [current, forecast] = await Promise.all([
          this.getCurrentWeather(lat, lon, units),
          this.getForecast(lat, lon, units)
        ]);
        
        // Create a simplified onecall-like structure from standard APIs
        return {
          current,
          daily: forecast.list.filter((item, idx) => idx % 8 === 0), // Every 8th entry is roughly daily
          hourly: forecast.list.slice(0, 24), // First 24 forecast entries (~3 hours each)
        };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw new Error(`Failed to fetch comprehensive weather data: ${error.message}`);
      }
    }
  },
  
  async getHistoricalWeather(lat, lon, dt, units = 'metric') {
    try {
      // dt should be a Unix timestamp for the requested date (up to 5 days ago)
      const response = await axios.get(`${ONE_CALL_URL}/timemachine`, {
        params: {
          lat, 
          lon,
          dt,
          units,
          appid: API_KEY
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch historical weather data');
    }
  },
  
  async getWeatherAlerts(lat, lon) {
    try {
      // One Call API includes alerts if they exist
      const response = await axios.get(ONE_CALL_URL, {
        params: {
          lat,
          lon,
          exclude: 'current,minutely,hourly,daily',
          appid: API_KEY
        }
      });
      return response.data.alerts || [];
    } catch (error) {
      throw new Error('Failed to fetch weather alerts');
    }
  }
};