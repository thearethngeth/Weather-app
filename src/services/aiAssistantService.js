import axios from 'axios';
import { translateText, detectLanguage, LanguageCode, isHistoricalQuery } from '@/services/translationService';

const OPENAI_API_KEY = process.env.VUE_APP_OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const isProd = process.env.NODE_ENV === 'production';
const AI_BACKEND_URL = '/.netlify/functions/ai';

/**
 * Build system prompt with current weather context
 */
function buildSystemPrompt(weather, forecast, units) {
  const unitSymbol = units === 'metric' ? '°C' : '°F';
  let prompt = `You are WeatherWise AI, a friendly weather assistant. `;
  prompt += `Provide concise, helpful answers based on the current weather data below.\n\n`;
  
  if (weather) {
    prompt += `📍 CURRENT LOCATION: ${weather.name}\n`;
    prompt += `🌡️ Temperature: ${weather.main.temp}${unitSymbol} (feels like ${weather.main.feels_like}${unitSymbol})\n`;
    prompt += `☁️ Conditions: ${weather.weather[0].description}\n`;
    prompt += `💧 Humidity: ${weather.main.humidity}%\n`;
    prompt += `💨 Wind: ${weather.wind.speed} m/s\n`;
    if (weather.rain) prompt += `🌧️ Rain (last 3h): ${weather.rain['3h'] || 0} mm\n`;
  }
  
  if (forecast && forecast.list) {
    const next24h = forecast.list.slice(0, 8);
    const temps = next24h.map(t => t.main.temp);
    const avgTemp = (temps.reduce((a,b) => a+b,0)/temps.length).toFixed(1);
    const rainProb = Math.max(...next24h.map(t => t.pop || 0));
    prompt += `\n📅 FORECAST (next 24h): Avg ${avgTemp}${unitSymbol}, `;
    prompt += `Max rain probability ${Math.round(rainProb*100)}%.\n`;
  }
  
  prompt += `\nGuidelines:
- Answer naturally and conversationally.
- If user asks about clothing, activities, or umbrella – give practical advice.
- Always mention the current location if relevant.
- Keep responses under 150 words.
- If the user asks something unrelated to weather, politely say you can only help with weather.
`;
  return prompt;
}

/**
 * Generate mock AI response for testing without API key
 */
function generateMockResponse(query, weather, forecast) {
  const query_lower = query.toLowerCase();
  
  // Mock responses for common queries
  if (query_lower.includes('weather') || query_lower.includes('today')) {
    if (weather) {
      const temp = weather.main.temp;
      const condition = weather.weather[0].description;
      return `Today in **${weather.name}** the weather will be **${condition}** with a temperature of around **${temp}°C**. 🌤️`;
    }
    return `Please search for a city first to get current weather conditions! 📍`;
  }
  
  if (query_lower.includes('wear') || query_lower.includes('clothing')) {
    if (weather && weather.main.temp) {
      const temp = weather.main.temp;
      if (temp > 25) return `It's quite warm! 👕 Wear light, breathable clothing like t-shirts, shorts, and sunglasses. Don't forget sunscreen! ☀️`;
      if (temp > 15) return `It's mild weather. 👔 A light jacket or sweater would be comfortable with casual pants. 👖`;
      if (temp > 5) return `It's cool. 🧥 Wear a warm jacket and long pants to stay comfortable. 🧣`;
      return `It's very cold! ❄️ Bundle up with a heavy coat, scarf, gloves, and warm boots! 🧢`;
    }
    return `Search for a location to get clothing recommendations! 📍`;
  }
  
  if (query_lower.includes('rain') || query_lower.includes('umbrella')) {
    if (weather && forecast) {
      const rainProb = Math.max(...(forecast.list || []).slice(0, 8).map(t => t.pop || 0));
      if (rainProb > 0.6) return `⛈️ There's a high chance of rain! Definitely bring an umbrella. 🌧️`;
      if (rainProb > 0.3) return `🌧️ There might be some showers. It would be good to have an umbrella handy.`;
      return `☀️ Rain is unlikely. You probably won't need an umbrella today!`;
    }
    return `Search for a location to get rain predictions! 📍`;
  }
  
  if (query_lower.includes('outdoor') || query_lower.includes('activity')) {
    if (weather) {
      const temp = weather.main.temp;
      const condition = weather.weather[0].main.toLowerCase();
      if (condition.includes('rain') || condition.includes('storm')) {
        return `Not ideal for outdoor activities today. 🌧️ Consider indoor alternatives like visiting a museum or indoor sports. 🏠`;
      }
      if (temp > 20 && temp < 30) {
        return `Perfect weather for outdoor activities! 🌞 Great for hiking, picnics, sports, or just walking around. Have fun! 🎉`;
      }
      if (temp < 5) {
        return `It's too cold for most outdoor activities. ❄️ Stay warm indoors instead! 🏠`;
      }
      return `Weather is acceptable for outdoor activities. Have a nice time! 🌤️`;
    }
    return `Search for a location to get activity recommendations! 📍`;
  }
  
  // Default response
  return `I'm here to help with weather questions! Ask me about:\n• Current weather ☀️\n• What to wear 👕\n• Rain predictions 🌧️\n• Outdoor activities 🎉\n\nSearch for a city first to get specific recommendations! 📍`;
}

/**
 * Main function: process user query, optionally translate, call OpenAI, translate back
 * @param {Object} params
 * @param {string} params.userMessage - Raw user input
 * @param {string} params.preferredLanguage - 'en' or 'km'
 * @param {Object} params.weather - Vuex weather state
 * @param {Object} params.forecast - Vuex forecast state
 * @param {string} params.units - 'metric' or 'imperial'
 */
export async function getWeatherAssistantReply({ userMessage, preferredLanguage, weather, forecast, units, conversationHistory = [] }) {
  const detectedLang = detectLanguage(userMessage);
  const finalLang = preferredLanguage || detectedLang;

  // Step 1: Translate user message to English (if needed) for OpenAI
  let queryForAI = userMessage;
  if (finalLang === LanguageCode.KHMER) {
    queryForAI = await translateText(userMessage, 'km', 'en');
  }

  // Step 2: Build system prompt with weather context
  const systemPrompt = buildSystemPrompt(weather, forecast, units);

  // Build history (last 10 messages to stay within token limits)
  const historyMessages = conversationHistory.slice(-10).map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.text
  }));

  // Step 3: Call OpenAI
  let aiResponseEnglish = '';
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-api-key-here') {
      // Mock response for testing when API key is not configured
      console.warn('⚠️ OpenAI API key not configured. Using mock response for demonstration.');
      aiResponseEnglish = generateMockResponse(queryForAI, weather, forecast);
    } else {
      const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: queryForAI }
        ],
        temperature: 0.7,
        max_tokens: 300
      };

      const response = isProd
        ? await axios.post(AI_BACKEND_URL, payload)
        : await axios.post(OPENAI_URL, payload, {
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
          });
      aiResponseEnglish = response.data.choices[0].message.content.trim();
    }
  } catch (error) {
    console.error('OpenAI error:', error);
    // Fallback to mock response on error
    console.warn('⚠️ Using mock response due to API error. Add valid OpenAI API key to .env');
    aiResponseEnglish = generateMockResponse(queryForAI, weather, forecast);
  }
  
  // Step 4: Translate AI response back to Khmer if needed
  let finalResponse = aiResponseEnglish;
  if (finalLang === LanguageCode.KHMER) {
    finalResponse = await translateText(aiResponseEnglish, 'en', 'km');
  }
  
  return { response: finalResponse };
}
