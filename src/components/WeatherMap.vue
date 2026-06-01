<template>
  <div class="weather-map-card">
    <div class="map-controls">
      <div class="layer-selectors">
        <button 
          v-for="layer in layerOptions" 
          :key="layer.id"
          :class="['layer-btn', { active: activeLayer === layer.id }]"
          @click="setActiveLayer(layer.id)"
        >
          <i :class="layer.icon"></i>
          <span>{{ layer.label }}</span>
        </button>
      </div>
      
      <!-- Temperature unit toggle (only shown for temperature layer) -->
      <div v-if="activeLayer === 'temp'" class="temp-controls">
        <div class="unit-toggle">
          <button 
            :class="['unit-btn', { active: tempUnit === 'C' }]"
            @click="setTempUnit('C')"
          >&deg;C</button>
          <button 
            :class="['unit-btn', { active: tempUnit === 'F' }]"
            @click="setTempUnit('F')"
          >&deg;F</button>
        </div>
        <label class="isotherm-toggle">
          <input type="checkbox" v-model="showIsotherms" @change="toggleIsotherms">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Isotherms</span>
        </label>
      </div>
    </div>
    
    <div id="weather-map" class="map-container"></div>
    
    <div class="map-legend">
      <div v-if="activeLayer === 'temp'" class="legend-temp">
        <div class="legend-header">
          <div class="legend-title">Temperature ({{ tempUnit === 'C' ? 'C' : 'F' }})</div>
          <div class="legend-subtitle">
            <span class="cold-indicator"><i class="fas fa-snowflake"></i> Cold</span>
            <span class="moderate-indicator"><i class="fas fa-sun"></i> Moderate</span>
            <span class="hot-indicator"><i class="fas fa-fire"></i> Hot</span>
          </div>
        </div>
        <div class="legend-colors temp-gradient">
          <!-- Cold zone: Blue/Purple -->
          <div class="color-item cold" style="background: #313695;">{{ formatTemp(-40) }}</div>
          <div class="color-item cold" style="background: #4575b4;">{{ formatTemp(-30) }}</div>
          <div class="color-item cold" style="background: #74add1;">{{ formatTemp(-20) }}</div>
          <div class="color-item cold" style="background: #abd9e9;">{{ formatTemp(-10) }}</div>
          <!-- Moderate zone: Green/Yellow -->
          <div class="color-item moderate" style="background: #e0f3f8;">{{ formatTemp(0) }}</div>
          <div class="color-item moderate" style="background: #ffffbf;">{{ formatTemp(10) }}</div>
          <div class="color-item moderate" style="background: #a6d96a;">{{ formatTemp(15) }}</div>
          <!-- Hot zone: Orange/Red -->
          <div class="color-item hot" style="background: #fee090;">{{ formatTemp(20) }}</div>
          <div class="color-item hot" style="background: #fdae61;">{{ formatTemp(25) }}</div>
          <div class="color-item hot" style="background: #f46d43;">{{ formatTemp(30) }}</div>
          <div class="color-item hot" style="background: #d73027;">{{ formatTemp(35) }}</div>
          <div class="color-item hot" style="background: #a50026;">{{ formatTemp(40) }}</div>
        </div>
        <div v-if="showIsotherms" class="isotherm-info">
          <i class="fas fa-info-circle"></i>
          <span>Isotherms connect areas of equal temperature</span>
        </div>
      </div>
      
      <div v-else-if="activeLayer === 'precipitation'" class="legend-precip">
        <div class="legend-header">
          <div class="legend-title">Precipitation (mm/h)</div>
          <div class="legend-subtitle">
            <span class="light-rain-indicator"><i class="fas fa-cloud-rain"></i> Light</span>
            <span class="moderate-rain-indicator"><i class="fas fa-cloud-showers-heavy"></i> Moderate</span>
            <span class="heavy-rain-indicator"><i class="fas fa-cloud-bolt"></i> Heavy</span>
            <span class="snow-indicator"><i class="fas fa-snowflake"></i> Snow</span>
          </div>
        </div>
        <div class="legend-colors precip-gradient">
          <!-- No precipitation -->
          <div class="color-item" style="background: rgba(225, 243, 255, 0.2);">0</div>
          <!-- Light rain: Light blue/green -->
          <div class="color-item light-precip" style="background: #c6e6f7;">0.1</div>
          <div class="color-item light-precip" style="background: #96d4f0;">0.5</div>
          <div class="color-item light-precip" style="background: #6bc1e8;">1</div>
          <!-- Moderate rain: Medium blue -->
          <div class="color-item moderate-precip" style="background: #4ba8db;">2</div>
          <div class="color-item moderate-precip" style="background: #3498db;">5</div>
          <!-- Heavy rain: Dark blue/purple -->
          <div class="color-item heavy-precip" style="background: #2980b9;">10</div>
          <div class="color-item heavy-precip" style="background: #8e44ad;">20</div>
          <div class="color-item heavy-precip" style="background: #6c3483;">30</div>
          <div class="color-item heavy-precip" style="background: #4a235a;">50+</div>
        </div>
        <div class="precip-symbols">
          <div class="symbol-item">
            <i class="fas fa-tint" style="color: #6bc1e8;"></i>
            <span>Drizzle</span>
          </div>
          <div class="symbol-item">
            <i class="fas fa-cloud-rain" style="color: #3498db;"></i>
            <span>Rain</span>
          </div>
          <div class="symbol-item">
            <i class="fas fa-cloud-showers-heavy" style="color: #8e44ad;"></i>
            <span>Heavy</span>
          </div>
          <div class="symbol-item">
            <i class="fas fa-snowflake" style="color: #85c1e9;"></i>
            <span>Snow</span>
          </div>
        </div>
        <div class="radar-info">
          <i class="fas fa-broadcast-tower"></i>
          <span>Radar shows intensity and movement of precipitation</span>
        </div>
      </div>
      
      <div v-else-if="activeLayer === 'pressure'" class="legend-pressure">
        <div class="legend-header">
          <div class="legend-title">Atmospheric Pressure (hPa)</div>
          <div class="legend-subtitle">
            <span class="high-pressure-indicator"><span class="pressure-symbol high">H</span> High Pressure</span>
            <span class="low-pressure-indicator"><span class="pressure-symbol low">L</span> Low Pressure</span>
          </div>
        </div>
        <div class="legend-colors pressure-gradient">
          <!-- Low pressure: Purple/Red -->
          <div class="color-item low-press" style="background: #7b241c;">950</div>
          <div class="color-item low-press" style="background: #a93226;">970</div>
          <div class="color-item low-press" style="background: #cb4335;">985</div>
          <!-- Normal pressure: Yellow/Green -->
          <div class="color-item normal-press" style="background: #f4d03f;">1000</div>
          <div class="color-item normal-press" style="background: #82e0aa;">1013</div>
          <div class="color-item normal-press" style="background: #58d68d;">1020</div>
          <!-- High pressure: Blue -->
          <div class="color-item high-press" style="background: #5dade2;">1030</div>
          <div class="color-item high-press" style="background: #3498db;">1040</div>
          <div class="color-item high-press" style="background: #2874a6;">1050</div>
        </div>
        <div class="pressure-systems">
          <div class="pressure-system high-system">
            <span class="pressure-symbol-large high">H</span>
            <div class="system-info">
              <strong>High Pressure</strong>
              <span>Clear, calm weather</span>
            </div>
          </div>
          <div class="pressure-system low-system">
            <span class="pressure-symbol-large low">L</span>
            <div class="system-info">
              <strong>Low Pressure</strong>
              <span>Clouds, wind, rain</span>
            </div>
          </div>
        </div>
        <div class="isobar-info">
          <i class="fas fa-grip-lines"></i>
          <span>Isobars connect areas of equal atmospheric pressure</span>
        </div>
      </div>
      
      <div v-else-if="activeLayer === 'clouds'" class="legend-clouds">
        <div class="legend-title">Cloud Coverage (%)</div>
        <div class="legend-colors">
          <div class="color-item" style="background: #ffffff;">0</div>
          <div class="color-item" style="background: #f0f0f0;">20</div>
          <div class="color-item" style="background: #d9d9d9;">40</div>
          <div class="color-item" style="background: #bdbdbd;">60</div>
          <div class="color-item" style="background: #969696;">80</div>
          <div class="color-item" style="background: #525252;">100</div>
        </div>
      </div>
      
      <div v-else class="legend-wind">
        <div class="legend-title">Wind Speed (m/s)</div>
        <div class="legend-colors">
          <div class="color-item" style="background: #ffffff;">0</div>
          <div class="color-item" style="background: #e6f2e0;">5</div>
          <div class="color-item" style="background: #b2e2b2;">10</div>
          <div class="color-item" style="background: #66c266;">15</div>
          <div class="color-item" style="background: #2ca25f;">20</div>
          <div class="color-item" style="background: #006837;">25+</div>
        </div>
      </div>
    </div>
    
    <div class="map-footer">
      <span>
        <i class="fas fa-info-circle me-1"></i>
        Map data &copy; OpenWeatherMap
      </span>
      <span>Last updated: {{ lastUpdated }}</span>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import 'leaflet/dist/leaflet.css';

export default {
  name: "WeatherMap",
  setup() {
    const store = useStore();
    let map = null;
    let tileLayer = null;
    let isothermLayer = null;
    let clickMarker = null;

    const activeLayer = ref('temp');
    const mapInitialized = ref(false);
    const tempUnit = ref('C');
    const showIsotherms = ref(false);
    
    const layerOptions = [
      { id: 'temp', label: 'Temperature', icon: 'fas fa-temperature-high' },
      { id: 'precipitation', label: 'Precipitation', icon: 'fas fa-cloud-rain' },
      { id: 'pressure', label: 'Pressure', icon: 'fas fa-tachometer-alt' },
      { id: 'clouds', label: 'Clouds', icon: 'fas fa-cloud' },
      { id: 'wind', label: 'Wind', icon: 'fas fa-wind' }
    ];
    
    const showIsobars = ref(false);
    
    // Convert Celsius to Fahrenheit
    const celsiusToFahrenheit = (celsius) => {
      return Math.round((celsius * 9/5) + 32);
    };
    
    // Format temperature based on selected unit
    const formatTemp = (tempC) => {
      if (tempUnit.value === 'F') {
        return celsiusToFahrenheit(tempC);
      }
      return tempC;
    };
    
    const setTempUnit = (unit) => {
      tempUnit.value = unit;
    };
    
    const lastUpdated = computed(() => {
      return new Date().toLocaleTimeString();
    });
    
    const location = computed(() => {
      return store.state.selectedLocation;
    });
    
    const initMap = () => {
      if (mapInitialized.value) return;
      
      // Import Leaflet dynamically to avoid SSR issues
      import('leaflet').then((L) => {
        if (!document.getElementById('weather-map')) return;

        // Fix default marker icon 404s caused by webpack asset hashing
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
        
        // Create map centered at current location or default to New York
        const defaultLat = 40.7128;
        const defaultLon = -74.006;
        
        map = L.map('weather-map').setView(
          [location.value?.lat || defaultLat, location.value?.lon || defaultLon], 
          8
        );
        
        // Add OpenStreetMap base layer with English language
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          language: 'en'
        }).addTo(map);
        
        // Add click handler
        map.on('click', handleMapClick);

        // Add initial weather layer
        addWeatherLayer(activeLayer.value);
        
        // Add marker for current location
        if (location.value) {
          L.marker([location.value.lat, location.value.lon])
            .addTo(map)
            .bindPopup(location.value.display || 'Selected Location');
        }
        
        mapInitialized.value = true;
      });
    };
    
    const addWeatherLayer = (layerId) => {
      if (!map) return;
      
      // If there's an existing tile layer, remove it
      if (tileLayer) {
        map.removeLayer(tileLayer);
      }
      
      // API Key
      const API_KEY = process.env.VUE_APP_WEATHER_API_KEY || "ffebb6d220be97c63c7cf84998a7af7f";
      
      // Define layer URL based on selected type
      let layerUrl = '';
      
      switch (layerId) {
        case 'temp':
          layerUrl = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`;
          break;
        case 'precipitation':
          layerUrl = `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`;
          break;
        case 'clouds':
          layerUrl = `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`;
          break;
        case 'pressure':
          layerUrl = `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`;
          break;
        case 'wind':
          layerUrl = `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`;
          break;
        default:
          layerUrl = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`;
      }
      
      // Add the selected weather layer
      import('leaflet').then((L) => {
        tileLayer = L.tileLayer(layerUrl, {
          attribution: 'Map data &copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
          maxZoom: 18,
          opacity: 0.7
        }).addTo(map);
      });
    };
    
    const setActiveLayer = (layerId) => {
      activeLayer.value = layerId;
      
      // Remove isotherms when switching away from temperature
      if (layerId !== 'temp' && isothermLayer && map) {
        map.removeLayer(isothermLayer);
        isothermLayer = null;
        showIsotherms.value = false;
      }
      
      // Reset isobars when switching away from pressure
      if (layerId !== 'pressure') {
        showIsobars.value = false;
      }
      
      if (mapInitialized.value) {
        addWeatherLayer(layerId);
      }
    };
    
    // Toggle isotherms (contour lines connecting equal temperatures)
    const toggleIsotherms = () => {
      if (!map) return;
      
      import('leaflet').then((L) => {
        if (showIsotherms.value) {
          // Add isotherm layer - using a pressure layer as a proxy for contour lines
          // In production, you'd use actual isotherm data
          const API_KEY = process.env.VUE_APP_WEATHER_API_KEY || "ffebb6d220be97c63c7cf84998a7af7f";
          isothermLayer = L.tileLayer(
            `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
            {
              attribution: 'Isotherms &copy; OpenWeatherMap',
              maxZoom: 18,
              opacity: 0.4
            }
          ).addTo(map);
        } else {
          // Remove isotherm layer
          if (isothermLayer) {
            map.removeLayer(isothermLayer);
            isothermLayer = null;
          }
        }
      });
    };
    
    // Watch for location changes to update map center
    watch(() => location.value, (newLocation) => {
      if (newLocation && map) {
        import('leaflet').then((L) => {
          // Update map center
          map.setView([newLocation.lat, newLocation.lon], 8);
          
          // Clear existing markers
          map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
              map.removeLayer(layer);
            }
          });
          
          // Add new marker
          L.marker([newLocation.lat, newLocation.lon])
            .addTo(map)
            .bindPopup(newLocation.display || 'Selected Location');
        });
      }
    });
    
    const handleMapClick = (e) => {
      if (!map) return;
      const { lat, lng } = e.latlng;

      import('leaflet').then((L) => {
        // Remove previous click marker
        if (clickMarker) map.removeLayer(clickMarker);

        clickMarker = L.marker([lat, lng])
          .addTo(map)
          .bindPopup('<div style="text-align:center;padding:4px 8px">⏳ Loading weather...</div>')
          .openPopup();

        store.dispatch('fetchWeatherByCoords', { lat, lon: lng });
      });
    };

    // Watch weather changes to update the click marker popup
    watch(() => store.state.weather, (weather) => {
      if (!clickMarker || !weather) return;
      const loc = store.state.selectedLocation;
      const temp = weather.main?.temp;
      const desc = weather.weather?.[0]?.description;
      const humidity = weather.main?.humidity;
      const wind = weather.wind?.speed;
      const name = loc?.display || weather.name || 'Unknown';

      clickMarker.setPopupContent(`
        <div style="min-width:160px;font-family:sans-serif">
          <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px">📍 ${name}</div>
          <div style="font-size:1.3rem;font-weight:800;color:#6366f1">${Math.round(temp)}°C</div>
          <div style="font-size:0.8rem;text-transform:capitalize;color:#555;margin-bottom:6px">${desc}</div>
          <div style="font-size:0.75rem;color:#666;display:flex;gap:10px">
            <span>💧 ${humidity}%</span>
            <span>💨 ${wind} m/s</span>
          </div>
        </div>
      `);
      clickMarker.openPopup();
    });

    onMounted(() => {
      // Initialize map after component is mounted
      initMap();
    });
    
    onBeforeUnmount(() => {
      // Clean up map instance when component is unmounted
      if (map) {
        map.remove();
        map = null;
        mapInitialized.value = false;
      }
      if (isothermLayer) {
        isothermLayer = null;
      }
    });
    
    return {
      activeLayer,
      layerOptions,
      lastUpdated,
      setActiveLayer,
      tempUnit,
      setTempUnit,
      formatTemp,
      showIsotherms,
      toggleIsotherms,
      showIsobars
    };
  }
};
</script>

<style scoped>
.weather-map-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.weather-map-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.map-controls {
  padding: 1.25rem;
  border-bottom: 2px solid rgba(203, 213, 225, 0.2);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(249, 250, 251, 0.3) 100%);
}

/* Temperature-specific controls */
.temp-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(203, 213, 225, 0.3);
}

.unit-toggle {
  display: flex;
  background: rgba(243, 244, 246, 0.8);
  border-radius: 20px;
  padding: 3px;
  border: 1px solid rgba(203, 213, 225, 0.4);
}

.unit-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  background: transparent;
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.85rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.unit-btn:hover {
  color: #4b5563;
}

.unit-btn.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.isotherm-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.isotherm-toggle input {
  display: none;
}

.toggle-slider {
  width: 40px;
  height: 22px;
  background: rgba(203, 213, 225, 0.6);
  border-radius: 11px;
  position: relative;
  transition: all 0.3s ease;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.isotherm-toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

.isotherm-toggle input:checked + .toggle-slider::after {
  transform: translateX(18px);
}

.toggle-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #4b5563;
}

.layer-selectors {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.layer-btn {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(243, 244, 246, 0.9) 100%);
  border: 2px solid rgba(99, 102, 241, 0.2);
  border-radius: 24px;
  padding: 0.6rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  white-space: nowrap;
  color: #4b5563;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.layer-btn:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-color: rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.layer-btn.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-color: #6366f1;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
}

.layer-btn i {
  font-size: 1.1rem;
}

.map-container {
  flex: 1;
  min-height: 500px;
  width: 100%;
  z-index: 1;
  position: relative;
  cursor: crosshair;
}

.map-container::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 0;
  pointer-events: none;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.05);
}

.map-legend {
  padding: 1rem 1.25rem;
  background: linear-gradient(180deg, rgba(249, 250, 251, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%);
  border-top: 2px solid rgba(203, 213, 225, 0.2);
}

.legend-header {
  margin-bottom: 0.75rem;
}

.legend-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.4rem;
  letter-spacing: 0.3px;
}

.legend-subtitle {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
}

.cold-indicator {
  color: #4575b4;
}

.cold-indicator i {
  color: #4575b4;
  margin-right: 0.25rem;
}

.moderate-indicator {
  color: #66bb6a;
}

.moderate-indicator i {
  color: #ffca28;
  margin-right: 0.25rem;
}

.hot-indicator {
  color: #d73027;
}

.hot-indicator i {
  color: #f46d43;
  margin-right: 0.25rem;
}

.legend-colors {
  display: flex;
  width: 100%;
  height: 28px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.legend-colors.temp-gradient {
  height: 32px;
}

.color-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
}

.color-item.cold {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.color-item.hot {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.color-item:hover {
  transform: scale(1.05);
  z-index: 1;
}

.isotherm-info {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 8px;
  font-size: 0.75rem;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.isotherm-info i {
  color: #6366f1;
}

/* Precipitation Legend Styles */
.legend-precip .legend-subtitle {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  flex-wrap: wrap;
}

.light-rain-indicator {
  color: #6bc1e8;
}

.light-rain-indicator i {
  color: #6bc1e8;
  margin-right: 0.25rem;
}

.moderate-rain-indicator {
  color: #3498db;
}

.moderate-rain-indicator i {
  color: #3498db;
  margin-right: 0.25rem;
}

.heavy-rain-indicator {
  color: #8e44ad;
}

.heavy-rain-indicator i {
  color: #8e44ad;
  margin-right: 0.25rem;
}

.snow-indicator {
  color: #85c1e9;
}

.snow-indicator i {
  color: #85c1e9;
  margin-right: 0.25rem;
}

.legend-colors.precip-gradient {
  height: 32px;
}

.color-item.light-precip {
  color: #1a5276;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.color-item.moderate-precip {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.color-item.heavy-precip {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.precip-symbols {
  display: flex;
  justify-content: space-around;
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: rgba(52, 152, 219, 0.08);
  border-radius: 8px;
}

.symbol-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: #4b5563;
}

.symbol-item i {
  font-size: 1rem;
}

.radar-info {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 8px;
  font-size: 0.75rem;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.radar-info i {
  color: #3498db;
}

/* Pressure System Legend Styles */
.legend-pressure .legend-subtitle {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  flex-wrap: wrap;
  align-items: center;
}

.high-pressure-indicator,
.low-pressure-indicator {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.pressure-symbol {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.75rem;
}

.pressure-symbol.high {
  background: linear-gradient(135deg, #3498db, #2874a6);
  color: white;
}

.pressure-symbol.low {
  background: linear-gradient(135deg, #e74c3c, #a93226);
  color: white;
}

.legend-colors.pressure-gradient {
  height: 32px;
}

.color-item.low-press {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.color-item.normal-press {
  color: #1a5276;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.color-item.high-press {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.pressure-systems {
  display: flex;
  justify-content: space-around;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(52, 73, 94, 0.06);
  border-radius: 10px;
  gap: 1rem;
}

.pressure-system {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.pressure-symbol-large {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-weight: 800;
  font-size: 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.pressure-symbol-large.high {
  background: linear-gradient(135deg, #3498db, #2874a6);
  color: white;
}

.pressure-symbol-large.low {
  background: linear-gradient(135deg, #e74c3c, #a93226);
  color: white;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.system-info strong {
  font-size: 0.8rem;
  color: #374151;
}

.system-info span {
  font-size: 0.7rem;
  color: #6b7280;
}

.isobar-info {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(52, 73, 94, 0.08);
  border-radius: 8px;
  font-size: 0.75rem;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.isobar-info i {
  color: #5d6d7e;
}

.map-footer {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #6b7280;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.8) 100%);
  border-top: 2px solid rgba(203, 213, 225, 0.2);
}

.map-footer i {
  color: #6366f1;
  margin-right: 0.25rem;
}

/* Dark theme support */
:global(body.dark-theme) {
  .weather-map-card {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
    border-color: rgba(51, 65, 85, 0.3);
  }
  
  .map-controls {
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.3) 100%);
    border-bottom-color: rgba(51, 65, 85, 0.3);
  }
  
  .temp-controls {
    border-top-color: rgba(51, 65, 85, 0.4);
  }
  
  .unit-toggle {
    background: rgba(51, 65, 85, 0.8);
    border-color: rgba(71, 85, 105, 0.4);
  }
  
  .unit-btn {
    color: #94a3b8;
  }
  
  .unit-btn:hover {
    color: #cbd5e1;
  }
  
  .toggle-slider {
    background: rgba(71, 85, 105, 0.6);
  }
  
  .toggle-label {
    color: #cbd5e1;
  }
  
  .layer-btn {
    background: linear-gradient(135deg, rgba(51, 65, 85, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
    border-color: rgba(99, 102, 241, 0.3);
    color: #cbd5e1;
  }
  
  .layer-btn:hover {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
    border-color: rgba(99, 102, 241, 0.5);
  }
  
  .layer-btn.active {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
  }
  
  .map-legend,
  .map-footer {
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.9) 100%);
    border-top-color: rgba(51, 65, 85, 0.3);
  }
  
  .legend-title {
    color: #e2e8f0;
  }
  
  .legend-subtitle .cold-indicator,
  .legend-subtitle .moderate-indicator,
  .legend-subtitle .hot-indicator {
    opacity: 0.9;
  }
  
  .legend-subtitle .light-rain-indicator,
  .legend-subtitle .moderate-rain-indicator,
  .legend-subtitle .heavy-rain-indicator,
  .legend-subtitle .snow-indicator {
    opacity: 0.9;
  }
  
  .isotherm-info {
    background: rgba(99, 102, 241, 0.2);
    color: #cbd5e1;
  }
  
  .precip-symbols {
    background: rgba(52, 152, 219, 0.15);
  }
  
  .symbol-item {
    color: #cbd5e1;
  }
  
  .radar-info {
    background: rgba(52, 152, 219, 0.2);
    color: #cbd5e1;
  }
  
  .pressure-systems {
    background: rgba(52, 73, 94, 0.15);
  }
  
  .system-info strong {
    color: #e2e8f0;
  }
  
  .system-info span {
    color: #94a3b8;
  }
  
  .isobar-info {
    background: rgba(52, 73, 94, 0.2);
    color: #cbd5e1;
  }
  
  .map-footer {
    color: #94a3b8;
  }
  
  .map-footer i {
    color: #818cf8;
  }
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .map-container {
    min-height: 300px;
  }
  
  .layer-selectors {
    justify-content: start;
  }
  
  .layer-btn {
    padding: 0.5rem 0.9rem;
    font-size: 0.9rem;
  }
  
  .layer-btn span {
    display: none;
  }
  
  .layer-btn i {
    font-size: 1.2rem;
    margin: 0;
  }
  
  .temp-controls {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .legend-subtitle {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .legend-colors.temp-gradient {
    height: 24px;
  }
  
  .color-item {
    font-size: 0.6rem;
  }
}
</style>
