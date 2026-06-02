<!-- src/components/WeatherSearch.vue -->
<template>
  <div class="ws-wrap">
    <div class="ws-inner">
      <div class="ws-input-row">
        <div class="ws-input-group">
          <i class="fas fa-magnifying-glass ws-search-icon"></i>
          <input
            type="text"
            class="ws-input"
            :placeholder="$t('searchPlaceholder')"
            v-model="cityInput"
            @keyup.enter="searchCity"
            @focus="showSuggestions = true"
            @input="debouncedSearchSuggestions"
            autocomplete="off"
            :disabled="loading"
          />
          <div v-if="showSuggestions && (suggestions.length > 0 || recentSearches.length > 0)" class="ws-suggestions">
            <div v-if="suggestions.length > 0" class="sugg-section">
              <p class="sugg-label">Suggestions</p>
              <ul class="sugg-list">
                <li v-for="(s, i) in suggestions" :key="`s-${i}`" @click="selectSuggestion(s)">
                  <i class="fas fa-location-dot"></i> {{ s.name }}, {{ s.country }}
                </li>
              </ul>
            </div>
            <div v-if="recentSearches.length > 0" class="sugg-section">
              <p class="sugg-label">Recent</p>
              <ul class="sugg-list">
                <li v-for="(r, i) in recentSearches" :key="`r-${i}`" @click="selectSuggestion(r)">
                  <i class="fas fa-history"></i> {{ r.name }}, {{ r.country }}
                  <button class="sugg-del" @click.stop="removeFromHistory(i)"><i class="fas fa-xmark"></i></button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <button class="ws-btn ws-btn-primary" @click="searchCity" :disabled="loading">
          <i class="fas fa-search"></i> {{ $t('search') }}
        </button>
        <button class="ws-btn ws-btn-secondary" @click="getCurrentLocation" :disabled="loading">
          <i class="fas fa-crosshairs"></i> {{ $t('currentLocation') }}
        </button>
      </div>

      <div class="ws-popular">
        <span class="ws-pop-label">{{ $t('popular') }}</span>
        <button v-for="city in popularCities" :key="city.name" @click="quickSearch(city)" class="ws-chip">
          {{ city.name }}
        </button>
      </div>

      <div v-if="error" class="ws-error">
        <i class="fas fa-circle-exclamation"></i> {{ error }}
      </div>

      <div v-if="loading" class="ws-loading">
        <div class="ws-dot"></div><div class="ws-dot"></div><div class="ws-dot"></div>
        <span>Fetching weather data...</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "WeatherSearch",

  data() {
    return {
      cityInput: "",
      suggestions: [],
      showSuggestions: false,
      popularCities: [
        { name: "Phnom Penh", country: "KH" },
        { name: "Siem Reap", country: "KH" },
        { name: "Battambang", country: "KH" },
        { name: "Sihanoukville", country: "KH" },
        { name: "Kampot", country: "KH" }
      ],
      debounceTimer: null,
    };
  },

  computed: {
    lang() { return this.$store.state.language; },
    $t() {
      const { t } = require('@/i18n/translations');
      return (key) => t(this.lang, key);
    },
    loading() {
      return this.$store.state.loading;
    },
    error() {
      return this.$store.state.error;
    },
    recentSearches() {
      const storedSearches = localStorage.getItem('recentSearches');
      return storedSearches ? JSON.parse(storedSearches) : [];
    }
  },

  created() {
    // Initialize debounced search function
    this.debouncedSearchSuggestions = this.debounce(this.fetchSuggestions, 300);
    
    // Close suggestions on click outside
    document.addEventListener('click', this.handleClickOutside);
  },
  
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },

  methods: {
    debounce(func, wait) {
      return (...args) => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          func.apply(this, args);
        }, wait);
      };
    },
    
    async searchCity() {
      if (!this.cityInput.trim()) return;

      try {
        await this.$store.dispatch("fetchWeatherByCity", this.cityInput.trim());
        // Only save to history if search was successful
        if (!this.$store.state.error) {
          this.saveToSearchHistory({
            name: this.cityInput.trim(),
            country: this.$store.state.weather?.sys?.country || ''
          });
        }
        this.cityInput = "";
        this.showSuggestions = false;
      } catch (error) {
        console.error("Search failed:", error);
      }
    },
    
    async fetchSuggestions() {
      if (!this.cityInput || this.cityInput.length < 2) {
        this.suggestions = [];
        return;
      }
      
      try {
        const API_KEY = process.env.VUE_APP_WEATHER_API_KEY;
        const response = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${this.cityInput}&limit=5&appid=${API_KEY}`
        );
        const data = await response.json();
        this.suggestions = data.map(city => ({
          name: city.name,
          country: city.country,
          lat: city.lat,
          lon: city.lon
        }));
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        this.suggestions = [];
      }
    },
    
    selectSuggestion(suggestion) {
      this.cityInput = suggestion.name;
      this.showSuggestions = false;
      
      if (suggestion.lat && suggestion.lon) {
        // If we have coordinates, use them directly
        this.$store.dispatch("fetchWeatherByCoords", { 
          lat: suggestion.lat, 
          lon: suggestion.lon 
        });
        this.saveToSearchHistory(suggestion);
      } else {
        // Otherwise search by city name
        this.searchCity();
      }
    },
    
    quickSearch(city) {
      this.cityInput = city.name;
      this.searchCity();
    },
    
    handleClickOutside(event) {
      const searchContainer = this.$el.querySelector('.ws-input-group');
      if (searchContainer && !searchContainer.contains(event.target)) {
        this.showSuggestions = false;
      }
    },
    
    saveToSearchHistory(city) {
      let searches = this.recentSearches;
      
      // Remove duplicates
      searches = searches.filter(item => 
        item.name.toLowerCase() !== city.name.toLowerCase()
      );
      
      // Add to beginning of array
      searches.unshift(city);
      
      // Keep only the latest 5 searches
      if (searches.length > 5) {
        searches = searches.slice(0, 5);
      }
      
      localStorage.setItem('recentSearches', JSON.stringify(searches));
    },
    
    removeFromHistory(index) {
      let searches = this.recentSearches;
      searches.splice(index, 1);
      localStorage.setItem('recentSearches', JSON.stringify(searches));
    },

    async getCurrentLocation() {
      if (!navigator.geolocation) {
        this.$store.commit(
          "SET_ERROR",
          "Geolocation is not supported by your browser"
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lon } = position.coords;
          try {
            await this.$store.dispatch("fetchWeatherByCoords", { lat, lon });
            
            // Try to get city name from reverse geocoding
            if (this.$store.state.weather?.name) {
              this.saveToSearchHistory({
                name: this.$store.state.weather.name,
                country: this.$store.state.weather.sys?.country || '',
                lat,
                lon
              });
            }
          } catch (error) {
            console.error("Location fetch failed:", error);
          }
        },
        (error) => {
          this.$store.commit("SET_ERROR", "Unable to retrieve your location");
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    },
  },
};
</script>
<style scoped>
.ws-wrap { width: 100%; }
.ws-inner { display: flex; flex-direction: column; gap: 10px; }

.ws-input-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto auto;
  gap: 8px;
  align-items: start;
}

.ws-input-group {
  position: relative;
  min-width: 0;
}

.ws-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted, #8aa0b0);
  font-size: 14px;
  pointer-events: none;
}

.ws-input {
  width: 100%;
  min-height: 44px;
  padding: 11px 14px 11px 40px;
  border: 1px solid var(--border, rgba(74,144,196,0.16));
  border-radius: 999px;
  background: var(--bg-card, #fff);
  color: var(--text-primary, #1a2d3d);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.ws-input:focus {
  border-color: var(--accent, #4a90c4);
  box-shadow: 0 0 0 4px rgba(74,144,196,0.12);
}

.ws-btn {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--border, rgba(74,144,196,0.16));
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  white-space: nowrap;
  font-family: inherit;
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
}

.ws-btn:hover {
  transform: translateY(-1px);
}

.ws-btn-primary {
  background: var(--accent, #4a90c4);
  color: var(--text-on-accent, #fff);
  border-color: var(--accent, #4a90c4);
}
.ws-btn-primary:hover { background: var(--accent-dark, #2e6fa3); }
.ws-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.ws-btn-secondary {
  background: var(--bg-card, #fff);
  color: var(--text-secondary, #4a6070);
}
.ws-btn-secondary:hover {
  background: var(--accent-light, #e8f4fd);
  color: var(--accent-dark, #2e6fa3);
  border-color: var(--border-strong, rgba(74,144,196,0.3));
}

.ws-suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 300;
  overflow: hidden;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, rgba(74,144,196,0.16));
  border-radius: 14px;
  box-shadow: var(--shadow-lg, 0 8px 32px rgba(30,80,128,0.12));
}

.sugg-section { padding: 9px 0 5px; }
.sugg-label {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-muted, #8aa0b0);
  padding: 0 14px;
  margin-bottom: 4px;
}
.sugg-list { list-style: none; padding: 0; margin: 0; }
.sugg-list li {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 14px;
  font-size: 13px;
  color: var(--text-primary, #1a2d3d);
  cursor: pointer;
  transition: background 0.15s;
}
.sugg-list li i { color: var(--accent, #4a90c4); font-size: 13px; }
.sugg-list li:hover { background: var(--accent-light, #e8f4fd); }
.sugg-del {
  margin-left: auto;
  background: transparent;
  border: 0;
  color: var(--text-muted, #8aa0b0);
  cursor: pointer;
  width: 26px;
  height: 26px;
  border-radius: 50%;
}
.sugg-del:hover { background: var(--bg-card-alt, #f8fbff); color: var(--text-primary, #1a2d3d); }

.ws-popular {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ws-pop-label {
  font-size: 11px;
  color: var(--text-muted, #8aa0b0);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ws-chip {
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid var(--border, rgba(74,144,196,0.16));
  background: transparent;
  color: var(--text-secondary, #4a6070);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 700;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.ws-chip:hover {
  background: var(--accent-light, #e8f4fd);
  color: var(--accent-dark, #2e6fa3);
  border-color: var(--border-strong, rgba(74,144,196,0.3));
}

.ws-error {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  background: rgba(218, 92, 72, 0.08);
  border: 1px solid rgba(218, 92, 72, 0.25);
  border-radius: 12px;
  color: #b84f3e;
  font-size: 13px;
  font-weight: 700;
}

.ws-loading {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--text-muted, #8aa0b0);
  padding: 2px 0;
}

.ws-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent, #4a90c4);
  animation: dotBounce 1.2s infinite ease-in-out;
}
.ws-dot:nth-child(2) { animation-delay: 0.2s; }
.ws-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

@media (max-width: 760px) {
  .ws-input-row { grid-template-columns: 1fr; }
  .ws-btn { width: 100%; }
}
</style>
