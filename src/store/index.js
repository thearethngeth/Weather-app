import { createStore } from 'vuex'
import { weatherService } from '@/services/weatherServices'

export default createStore({
  state: {
    weather: null,
    forecast: null,
    airQuality: null,
    oneCallData: null,
    historicalData: null,
    weatherAlerts: [],
    loading: false,
    forecastLoading: false,
    lastUpdated: null,
    error: null,
    units: 'metric', // Default to metric, can be 'imperial' or 'standard'
    selectedLocation: null
  },
  mutations: {
    SET_WEATHER(state, weather) {
      state.weather = weather
    },
    SET_FORECAST(state, forecast) {
      state.forecast = forecast
    },
    SET_AIR_QUALITY(state, airQuality) {
      state.airQuality = airQuality
    },
    SET_ONE_CALL_DATA(state, data) {
      state.oneCallData = data
    },
    SET_HISTORICAL_DATA(state, data) {
      state.historicalData = data
    },
    SET_WEATHER_ALERTS(state, alerts) {
      state.weatherAlerts = alerts
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_FORECAST_LOADING(state, loading) {
      state.forecastLoading = loading
    },
    SET_LAST_UPDATED(state, timestamp) {
      state.lastUpdated = timestamp
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_UNITS(state, units) {
      state.units = units
    },
    SET_SELECTED_LOCATION(state, location) {
      state.selectedLocation = location
    }
  },
  actions: {
    async fetchWeatherByCity({ commit, dispatch }, city) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const locationData = await weatherService.getCoordinatesByCity(city)
        
        if (locationData) {
          const { lat, lon, name, country, state } = locationData
          const locationDisplay = state 
            ? `${name}, ${state}, ${country}` 
            : `${name}, ${country}`
            
          commit('SET_SELECTED_LOCATION', {
            lat,
            lon,
            name,
            country,
            state,
            display: locationDisplay
          })
          
          await dispatch('fetchWeatherData', { lat, lon })
        } else {
          commit('SET_ERROR', 'City not found')
        }
      } catch (error) {
        commit('SET_ERROR', 'Failed to fetch city coordinates')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchWeatherByCoords({ commit, dispatch }, { lat, lon }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const locationData = await weatherService.getReverseGeocoding(lat, lon)
        const detailedDisplay = await weatherService.getDetailedLocation(lat, lon)

        if (locationData) {
          const { name, country, state } = locationData
          const locationDisplay = detailedDisplay
            || (state ? `${name}, ${state}, ${country}` : `${name}, ${country}`)

          commit('SET_SELECTED_LOCATION', {
            lat,
            lon,
            name,
            country,
            state,
            display: locationDisplay
          })
        }
        
        await dispatch('fetchWeatherData', { lat, lon })
      } catch (error) {
        commit('SET_ERROR', 'Failed to fetch location information')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchWeatherData({ commit, state }, { lat, lon }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      const units = state.units
      
      try {
        console.log('Starting weather data fetch process for:', { lat, lon, units });
        
        // Focus on the free API endpoints
        let weather, forecast, airQuality;
        let success = false;
        
        try {
          weather = await weatherService.getCurrentWeather(lat, lon, units);
          commit('SET_WEATHER', weather);
          console.log('Current weather data fetched successfully');
          success = true;
          
          // Since we don't have One Call API access, extract UV Index here if available
          if (weather && weather.main) {
            // Create a simple one call replacement from standard data
            const simpleOneCallData = {
              current: weather,
              daily: [], // Will be filled from forecast data 
              hourly: [],
            };
            
            commit('SET_ONE_CALL_DATA', simpleOneCallData);
          }
        } catch (err) {
          console.error('Failed to fetch current weather:', err);
        }
        
        try {
          forecast = await weatherService.getForecast(lat, lon, units);
          commit('SET_FORECAST', forecast);
          console.log('Forecast data fetched successfully');
          success = true;
          
          // Add forecast data to our simple one call replacement
          if (forecast && forecast.list) {
            // Get the one call data that might have been set above
            const oneCallData = state.oneCallData || { 
              current: weather || null,
              daily: [],
              hourly: []
            };
            
            // Group forecast entries by day for daily forecast
            const dailyForecasts = {};
            forecast.list.forEach(item => {
              const date = new Date(item.dt * 1000);
              const day = date.toISOString().split('T')[0];
              
              if (!dailyForecasts[day]) {
                dailyForecasts[day] = item;
              }
            });
            
            oneCallData.daily = Object.values(dailyForecasts);
            oneCallData.hourly = forecast.list.slice(0, 24);
            
            commit('SET_ONE_CALL_DATA', oneCallData);
          }
        } catch (err) {
          console.error('Failed to fetch forecast:', err);
        }
        
        try {
          airQuality = await weatherService.getAirQuality(lat, lon);
          commit('SET_AIR_QUALITY', airQuality);
          console.log('Air quality data fetched successfully');
          success = true;
        } catch (err) {
          console.error('Failed to fetch air quality:', err);
        }
        
        if (success) {
          // If at least one data point was fetched, consider it a success
          commit('SET_LAST_UPDATED', new Date().toISOString());
        } else {
          // If all data fetches failed, set an error
          throw new Error('All weather data requests failed');
        }
      } catch (error) {
        console.error('Error in fetchWeatherData:', error);
        commit('SET_ERROR', `Failed to fetch weather data: ${error.message}`);
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchHistoricalData({ commit, state }, timestamp) {
      if (!state.selectedLocation) return
      
      const { lat, lon } = state.selectedLocation
      const units = state.units
      
      try {
        const historicalData = await weatherService.getHistoricalWeather(
          lat, lon, timestamp, units
        )
        commit('SET_HISTORICAL_DATA', historicalData)
      } catch (error) {
        console.error('Error fetching historical data:', error)
      }
    },
    
    changeUnits({ commit, dispatch, state }, newUnits) {
      commit('SET_UNITS', newUnits)
      
      // If we have a selected location, fetch data again with new units
      if (state.selectedLocation) {
        const { lat, lon } = state.selectedLocation
        dispatch('fetchWeatherData', { lat, lon })
      }
    }
  },
  getters: {
    isLoading: state => state.loading,
    hasError: state => state.error !== null,
    errorMessage: state => state.error,
    currentWeather: state => state.weather,
    weatherForecast: state => state.forecast,
    currentLocation: state => state.selectedLocation?.display || null,
    currentAirQuality: state => state.airQuality,
    lastUpdatedFormatted: state => {
      if (!state.lastUpdated) return null
      return new Date(state.lastUpdated).toLocaleString()
    },
    getTemperatureUnit: state => `${String.fromCharCode(176)}${state.units === 'imperial' ? 'F' : 'C'}`,
    getSpeedUnit: state => state.units === 'imperial' ? 'mph' : 'm/s',
    hasAlerts: state => state.weatherAlerts && state.weatherAlerts.length > 0,
    
    // Daily forecast from One Call API
    dailyForecast: state => {
      if (!state.oneCallData || !state.oneCallData.daily) return []
      return state.oneCallData.daily
    },
    
    // UV Index from One Call API or estimated from weather conditions
    uvIndex: state => {
      // First try to get from One Call API if available
      if (state.oneCallData?.current?.uvi !== undefined) {
        return state.oneCallData.current.uvi;
      }
      
      // If no One Call API, estimate UV from weather and time of day
      if (state.weather) {
        // Get weather condition ID
        const weatherId = state.weather.weather?.[0]?.id;
        // Get clouds percentage
        const clouds = state.weather.clouds?.all || 0;
        // Get time of day (hour)
        const date = new Date();
        const hour = date.getHours();
        
        // Base UV on time of day
        let baseUV = 0;
        
        // Daytime hours (simplified model)
        if (hour >= 6 && hour <= 18) {
          // Peak UV at noon
          if (hour >= 10 && hour <= 14) {
            baseUV = 8; // High UV at peak hours
          } else if (hour >= 8 && hour < 10) {
            baseUV = 5; // Medium-high morning
          } else if (hour > 14 && hour <= 16) {
            baseUV = 5; // Medium-high afternoon
          } else {
            baseUV = 3; // Lower morning/evening
          }
          
          // Adjust for clouds
          if (clouds >= 75) {
            baseUV *= 0.3; // Heavy clouds block most UV
          } else if (clouds >= 50) {
            baseUV *= 0.5; // Medium cloud cover
          } else if (clouds >= 25) {
            baseUV *= 0.7; // Light cloud cover
          }
          
          // Adjust for weather conditions
          if (weatherId) {
            // Rain/snow/storm (200-700 range)
            if (weatherId >= 200 && weatherId < 700) {
              baseUV *= 0.4; // Precipitation reduces UV
            }
            // Heavy rain (500-531 range)
            if (weatherId >= 500 && weatherId <= 531) {
              baseUV *= 0.3; // Heavy rain blocks more UV
            }
          }
        }
        
        return Math.round(baseUV * 10) / 10; // Round to 1 decimal place
      }
      
      return 0; // Default if no data
    },
    
    // Get hourly forecast for next 24 hours
    hourlyForecast: state => {
      if (!state.oneCallData || !state.oneCallData.hourly) return []
      // Return first 24 hours
      return state.oneCallData.hourly.slice(0, 24)
    }
  }
})
