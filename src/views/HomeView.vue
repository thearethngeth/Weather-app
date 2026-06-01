<template>
  <div class="home">
    <header class="search-header">
      <div class="search-header-inner">
        <div class="station-copy">
          <span class="eyebrow">Weather station</span>
          <h1>Home</h1>
          <p>Minimal live weather dashboard for local decisions.</p>
        </div>

        <div class="search-tools">
          <WeatherSearch />
          <div class="units-toggle" aria-label="Temperature units">
            <button
              class="unit-btn"
              :class="{ active: units === 'metric' }"
              @click="switchUnits('metric')"
            >
              &deg;C
            </button>
            <button
              class="unit-btn"
              :class="{ active: units === 'imperial' }"
              @click="switchUnits('imperial')"
            >
              &deg;F
            </button>
          </div>
        </div>
      </div>

      <div class="location-bar" v-if="currentLocation">
        <span class="location-name">
          <i class="fas fa-location-dot"></i>
          {{ currentLocation }}
        </span>
        <span class="location-updated">
          <i class="fas fa-clock"></i>
          {{ lastUpdated }}
        </span>
      </div>
    </header>

    <button class="alert-banner" v-if="hasAlerts" @click="toggleAlertsModal">
      <i class="fas fa-triangle-exclamation"></i>
      <span
        >{{ alertsCount }} active weather
        {{ alertsCount === 1 ? "alert" : "alerts" }} for this location</span
      >
      <span class="alert-cta">View <i class="fas fa-chevron-right"></i></span>
    </button>

    <main class="content">
      <section class="dashboard-hero">
        <CurrentWeather />
      </section>

      <section class="quick-strip" v-if="summaryCards.length">
        <article
          v-for="item in summaryCards"
          :key="item.label"
          class="quick-tile"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </article>
      </section>

      <section class="section-heading">
        <span class="eyebrow">Live conditions</span>
        <h2>Atmospheric overview</h2>
      </section>

      <div class="card-grid">
        <article class="weather-card">
          <div class="card-head">
            <i class="fas fa-chart-bar"></i> Weather Stats
          </div>
          <WeatherStats />
        </article>
        
        <article class="weather-card">
          <div class="card-head"><i class="fas fa-wind"></i> Air Quality</div>
          <AirQuality />
        </article>

        <article class="weather-card">
          <div class="card-head">
            <i class="fas fa-sun"></i> Sunrise & Sunset
          </div>
          <SunriseSunset />
        </article>

        <article
          class="weather-card detail-card clickable"
          @click="openDetailModal('uv')"
          title="Open UV details"
        >
          <div class="card-head">
            <i class="fas fa-sun"></i> UV Index
            <i class="fas fa-expand expand-ic"></i>
          </div>
          <UVIndex />
        </article>

        <article
          class="weather-card detail-card clickable"
          @click="openDetailModal('precipitation')"
          title="Open precipitation details"
        >
          <div class="card-head">
            <i class="fas fa-cloud-rain"></i> Precipitation
            <i class="fas fa-expand expand-ic"></i>
          </div>
          <Precipitation />
        </article>

        <article
          class="weather-card detail-card clickable"
          @click="openDetailModal('visibility')"
          title="Open visibility details"
        >
          <div class="card-head">
            <i class="fas fa-eye"></i> Visibility
            <i class="fas fa-expand expand-ic"></i>
          </div>
          <Visibility />
        </article>

        <article
          id="weather-map-section"
          class="weather-card full-width map-panel"
        >
          <div class="card-head">
            <i class="fas fa-map-location-dot"></i> Weather Map
          </div>
          <WeatherMap />
        </article>

        <article id="hourly-forecast-section" class="weather-card full-width">
          <div class="card-head">
            <i class="fas fa-clock"></i> Hourly Forecast
          </div>
          <HourlyForecast />
        </article>

        <article id="five-day-forecast-section" class="weather-card full-width">
          <div class="card-head">
            <i class="fas fa-calendar-days"></i> 5-Day Forecast
          </div>
          <FiveDayForecast />
        </article>

        <article id="daily-planner-section" class="weather-card full-width">
          <div class="card-head">
            <i class="fas fa-calendar-check"></i> Daily Planner
          </div>
          <DailyPlanner />
        </article>

        <article class="weather-card full-width">
          <div class="card-head">
            <i class="fas fa-star"></i> Weather Highlights
          </div>
          <WeatherHighlights />
        </article>
      </div>
    </main>

    <nav class="bottom-nav" aria-label="Weather dashboard shortcuts">
      <button class="bnav-btn" @click="scrollToSection('weather-map-section')">
        <i class="fas fa-map-location-dot"></i><span>Map</span>
      </button>
      <button
        class="bnav-btn"
        @click="scrollToSection('hourly-forecast-section')"
      >
        <i class="fas fa-clock"></i><span>Hourly</span>
      </button>
      <button
        class="bnav-btn"
        @click="scrollToSection('five-day-forecast-section')"
      >
        <i class="fas fa-calendar-days"></i><span>5-Day</span>
      </button>
      <button class="bnav-btn" @click="scrollToTop">
        <i class="fas fa-arrow-up"></i><span>Top</span>
      </button>
    </nav>

    <footer class="site-footer">
      <p>
        &copy; 2026 ClimaSense &middot; Powered by
        <a href="https://openweathermap.org/" target="_blank" rel="noopener"
          >OpenWeatherMap</a
        >
      </p>
      <button
        class="footer-theme-btn"
        @click="toggleTheme"
        aria-label="Toggle theme"
      >
        <i :class="isDarkTheme ? 'fas fa-sun' : 'fas fa-moon'"></i>
      </button>
    </footer>

    <div
      class="modal-overlay"
      v-if="showAlertsModal"
      @click="toggleAlertsModal"
    ></div>
    <div class="cs-modal" v-if="showAlertsModal">
      <div class="cs-modal-head">
        <h3>Weather Alerts</h3>
        <button
          class="modal-close"
          @click="toggleAlertsModal"
          aria-label="Close alerts"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="cs-modal-body"><WeatherAlerts /></div>
    </div>

    <div
      class="modal-overlay"
      v-if="showDetailModal"
      @click="closeDetailModal"
    ></div>
    <div class="cs-modal detail-modal" v-if="showDetailModal">
      <div class="cs-modal-head">
        <h3>{{ detailModalTitle }}</h3>
        <button
          class="modal-close"
          @click="closeDetailModal"
          aria-label="Close details"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="cs-modal-body">
        <UVIndex v-if="detailModalType === 'uv'" />
        <Precipitation v-if="detailModalType === 'precipitation'" />
        <Visibility v-if="detailModalType === 'visibility'" />
      </div>
    </div>
  </div>
</template>

<script>
import WeatherSearch from "@/components/WeatherSearch.vue";
import CurrentWeather from "@/components/CurrentWeather.vue";
import FiveDayForecast from "@/components/FiveDayForecast.vue";
import AirQuality from "@/components/AirQuality.vue";
import SunriseSunset from "@/components/SunriseSunset.vue";
import WeatherHighlights from "@/components/WeatherHighlights.vue";
import HourlyForecast from "@/components/HourlyForecast.vue";
import UVIndex from "@/components/UVIndex.vue";
import WeatherMap from "@/components/WeatherMap.vue";
import WeatherAlerts from "@/components/WeatherAlerts.vue";
import DailyPlanner from "@/components/DailyPlanner.vue";
import Precipitation from "@/components/Precipitation.vue";
import Visibility from "@/components/Visibility.vue";
import WeatherStats from "@/components/WeatherStats.vue";
import { onMounted, ref, computed } from "vue";
import { useStore } from "vuex";
import AOS from "aos";
import "aos/dist/aos.css";

export default {
  name: "HomeView",
  components: {
    WeatherSearch,
    CurrentWeather,
    FiveDayForecast,
    AirQuality,
    SunriseSunset,
    WeatherHighlights,
    HourlyForecast,
    UVIndex,
    WeatherMap,
    WeatherAlerts,
    DailyPlanner,
    Precipitation,
    Visibility,
    WeatherStats,
  },
  setup() {
    const store = useStore();
    const showAlertsModal = ref(false);
    const showDetailModal = ref(false);
    const detailModalType = ref("");
    const isDarkTheme = ref(false);

    const currentLocation = computed(() => store.getters.currentLocation);
    const lastUpdated = computed(
      () => store.getters.lastUpdatedFormatted || "Waiting for weather data",
    );
    const units = computed(() => store.state.units);
    const weather = computed(() => store.state.weather);
    const hasAlerts = computed(() => store.getters.hasAlerts);
    const alertsCount = computed(() => store.state.weatherAlerts?.length || 0);
    const tempUnit = computed(() =>
      store.state.units === "imperial" ? "F" : "C",
    );
    const speedUnit = computed(() =>
      store.state.units === "imperial" ? "mph" : "m/s",
    );

    const summaryCards = computed(() => {
      if (!weather.value) return [];
      const degree = String.fromCharCode(176);
      return [
        {
          label: "Feels like",
          value: `${Math.round(weather.value.main.feels_like)}${degree}${
            tempUnit.value
          }`,
          icon: "fas fa-thermometer-half",
        },
        {
          label: "Humidity",
          value: `${weather.value.main.humidity}%`,
          icon: "fas fa-droplet",
        },
        {
          label: "Wind",
          value: `${Number(weather.value.wind.speed).toFixed(1)} ${
            speedUnit.value
          }`,
          icon: "fas fa-wind",
        },
        {
          label: "Pressure",
          value: `${weather.value.main.pressure} hPa`,
          icon: "fas fa-gauge-high",
        },
      ];
    });

    const toggleTheme = () => {
      isDarkTheme.value = !isDarkTheme.value;
      document.body.classList.toggle("dark-theme", isDarkTheme.value);
      localStorage.setItem(
        "weatherAppTheme",
        isDarkTheme.value ? "dark" : "light",
      );
      window.dispatchEvent(
        new CustomEvent("themeChanged", {
          detail: { isDark: isDarkTheme.value },
        }),
      );
    };
    const toggleAlertsModal = () => {
      showAlertsModal.value = !showAlertsModal.value;
      document.body.style.overflow = showAlertsModal.value ? "hidden" : "";
    };
    const openDetailModal = (type) => {
      detailModalType.value = type;
      showDetailModal.value = true;
      document.body.style.overflow = "hidden";
    };
    const closeDetailModal = () => {
      showDetailModal.value = false;
      detailModalType.value = "";
      document.body.style.overflow = "";
    };
    const detailModalTitle = computed(() => {
      const map = {
        uv: "UV Index Details",
        precipitation: "Precipitation Details",
        visibility: "Visibility Details",
      };
      return map[detailModalType.value] || "";
    });
    const switchUnits = (u) => {
      if (u !== store.state.units) store.dispatch("changeUnits", u);
    };
    const scrollToSection = (id) => {
      const el = document.getElementById(id);
      if (el)
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.pageYOffset - 86,
          behavior: "smooth",
        });
    };
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) =>
            store.dispatch("fetchWeatherByCoords", {
              lat: coords.latitude,
              lon: coords.longitude,
            }),
          () => store.dispatch("fetchWeatherByCity", "Phnom Penh"),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
      } else {
        store.dispatch("fetchWeatherByCity", "Phnom Penh");
      }
    };

    onMounted(() => {
      AOS.init({ duration: 520, easing: "ease-out", once: true });
      const saved = localStorage.getItem("weatherAppTheme");
      if (saved) {
        isDarkTheme.value = saved === "dark";
        document.body.classList.toggle("dark-theme", isDarkTheme.value);
      } else {
        const h = new Date().getHours();
        isDarkTheme.value = h < 6 || h >= 18;
        document.body.classList.toggle("dark-theme", isDarkTheme.value);
      }
      window.addEventListener("themeChanged", (e) => {
        isDarkTheme.value = e.detail.isDark;
      });
      getUserLocation();
    });

    return {
      currentLocation,
      lastUpdated,
      isDarkTheme,
      toggleTheme,
      hasAlerts,
      alertsCount,
      showAlertsModal,
      toggleAlertsModal,
      showDetailModal,
      detailModalType,
      detailModalTitle,
      openDetailModal,
      closeDetailModal,
      units,
      switchUnits,
      scrollToSection,
      scrollToTop,
      summaryCards,
    };
  },
};
</script>

<style lang="scss">
.home {
  min-height: 100vh;
  padding-bottom: 82px;
  color: var(--text-primary);
  background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.72),
      rgba(255, 255, 255, 0)
    ),
    repeating-linear-gradient(
      90deg,
      rgba(74, 144, 196, 0.045) 0 1px,
      transparent 1px 96px
    ),
    var(--bg-page);
}

.search-header {
  top: 60px;
  z-index: 100;
  border-bottom: 1px solid var(--border);
  background: rgba(250, 253, 255, 0.88);
  backdrop-filter: blur(18px);
}

body.dark-theme .search-header {
  background: rgba(13, 23, 33, 0.88);
}

.search-header-inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 22px 28px 16px;
  display: grid;
  grid-template-columns: minmax(220px, 320px) 1fr;
  gap: 22px;
  align-items: end;
}

.station-copy h1,
.section-heading h2 {
  margin: 0;
  color: var(--text-primary);
  font-family: "Space Grotesk", "Manrope", sans-serif;
  letter-spacing: 0;
}

.station-copy h1 {
  font-size: 34px;
  line-height: 1;
  font-weight: 700;
}

.station-copy p,
.section-heading p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--accent-dark);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.eyebrow::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--accent);
}

.search-tools {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: start;
}

.units-toggle {
  display: flex;
  padding: 4px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 999px;
  box-shadow: var(--shadow-sm);
}

.unit-btn {
  min-width: 48px;
  padding: 9px 13px;
  border: 0;
  background: transparent;
  border-radius: 999px;
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  transition: background 0.2s, color 0.2s;

  &.active {
    background: var(--accent);
    color: var(--text-on-accent);
  }

  &:hover:not(.active) {
    color: var(--accent-dark);
    background: var(--accent-light);
  }
}

.location-bar {
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 28px 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.location-name,
.location-updated {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.location-name {
  color: var(--text-primary);
  font-weight: 800;
}

.location-name i,
.location-updated i {
  color: var(--accent);
}

.alert-banner {
  width: min(1360px, calc(100% - 56px));
  margin: 16px auto 0;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(218, 92, 72, 0.25);
  border-radius: var(--radius-md);
  background: rgba(218, 92, 72, 0.08);
  color: #b84f3e;
  padding: 13px 16px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  text-align: left;

  .alert-cta {
    margin-left: auto;
    color: inherit;
  }
}

.content {
  max-width: 1360px;
  margin: 0 auto;
  padding: 24px 28px 34px;
}

.dashboard-hero {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-card);
  box-shadow: var(--shadow-md);
}

.dashboard-hero .cw-card,
.dashboard-hero .cw-loading {
  background: linear-gradient(
      135deg,
      rgba(232, 244, 253, 0.92),
      rgba(255, 255, 255, 0.84)
    ),
    repeating-linear-gradient(
      135deg,
      rgba(74, 144, 196, 0.08) 0 1px,
      transparent 1px 18px
    ) !important;
}

body.dark-theme .dashboard-hero .cw-card,
body.dark-theme .dashboard-hero .cw-loading {
  background: linear-gradient(
      135deg,
      rgba(22, 38, 56, 0.96),
      rgba(18, 31, 44, 0.92)
    ),
    repeating-linear-gradient(
      135deg,
      rgba(122, 184, 216, 0.08) 0 1px,
      transparent 1px 18px
    ) !important;
}

.dashboard-hero .cw-temp {
  font-family: "Space Grotesk", "Manrope", sans-serif;
  font-weight: 700 !important;
  letter-spacing: 0 !important;
  color: var(--text-primary) !important;
}

.dashboard-hero .cw-desc,
.dashboard-hero .cw-date,
.dashboard-hero .cw-daytime {
  color: var(--accent-dark) !important;
  font-weight: 800 !important;
}

.dashboard-hero .cw-range {
  flex-wrap: wrap;
}

.dashboard-hero .cw-range span,
.dashboard-hero .cw-stat {
  border: 1px solid var(--border) !important;
  border-radius: var(--radius-sm) !important;
  background: rgba(255, 255, 255, 0.54) !important;
}

body.dark-theme .dashboard-hero .cw-range span,
body.dark-theme .dashboard-hero .cw-stat {
  background: rgba(255, 255, 255, 0.05) !important;
}

.quick-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 14px 0 30px;
}

.quick-tile {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3px 12px;
  align-items: center;
  min-height: 78px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-card);

  i {
    grid-row: 1 / 3;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--accent-dark);
    background: var(--accent-light);
  }

  span {
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  strong {
    color: var(--text-primary);
    font-size: 19px;
    line-height: 1.1;
  }
}

.section-heading {
  margin: 0 0 14px;

  h2 {
    font-size: 24px;
    font-weight: 700;
  }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.weather-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: var(--shadow-sm);
  overflow: clip;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;

  &:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
  }

  &.clickable {
    cursor: pointer;
  }

  &.clickable:hover {
    transform: translateY(-2px);
  }

  &.full-width {
    grid-column: 1 / -1;
  }
}

.card-grid > .weather-card:not(.full-width) {
  min-height: 500px;
}

body.dark-theme .weather-card {
  background: rgba(18, 31, 44, 0.82);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 60px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card-alt);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.09em;
  text-transform: uppercase;

  i:first-child {
    color: var(--accent-dark);
  }

  .expand-ic {
    margin-left: auto;
    opacity: 0.45;
    font-size: 11px;
  }
}

.bottom-nav {
  position: fixed;
  inset: auto 0 0;
  z-index: 900;
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 9px 12px 11px;
  border-top: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

body.dark-theme .bottom-nav {
  background: rgba(13, 23, 33, 0.9);
}

.bnav-btn {
  min-width: 78px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font: inherit;
  transition: background 0.2s, color 0.2s;

  i {
    font-size: 17px;
  }
  span {
    font-size: 10px;
    font-weight: 800;
  }

  &:hover {
    background: var(--accent-light);
    color: var(--accent-dark);
  }
}

.site-footer {
  max-width: 1360px;
  margin: 0 auto 76px;
  padding: 12px 28px 22px;
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  font-size: 12px;

  p {
    margin: 0;
  }
  a {
    color: var(--accent-dark);
    text-decoration: none;
    font-weight: 800;
  }
  a:hover {
    text-decoration: underline;
  }
}

.footer-theme-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--accent-dark);
    background: var(--accent-light);
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(5, 10, 18, 0.46);
  backdrop-filter: blur(4px);
}

.cs-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 1001;
  width: min(720px, calc(100vw - 28px));
  max-height: min(84vh, 820px);
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-lg);
  animation: modalIn 0.22s ease-out;
}

.detail-modal {
  width: min(860px, calc(100vw - 28px));
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translate(-50%, -47%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.cs-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card-alt);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    color: var(--text-primary);
  }
}

.modal-close {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;

  &:hover {
    background: var(--accent-light);
    color: var(--accent-dark);
  }
}

.cs-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
}

/* Child component normalization for the minimalist shell. */
.weather-card .air-quality-card,
.weather-card .sun-card,
.weather-card .weather-stats-card,
.weather-card .uv-index-card,
.weather-card .precipitation-card,
.weather-card .visibility-card,
.weather-card .weather-map-card,
.weather-card .forecast-container,
.weather-card .hourly-forecast-container,
.weather-card .weather-highlights-container {
  width: 100% !important;
  max-width: none !important;
  flex: 1 1 auto;
  display: flex !important;
  flex-direction: column !important;
  height: auto !important;
  min-height: 100%;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  backdrop-filter: none !important;
}

.weather-card .card-content {
  padding: 20px 22px !important;
  gap: 18px !important;
}

.weather-card .air-quality-card > .card-content,
.weather-card .uv-index-card > .card-content,
.weather-card .precipitation-card > .card-content,
.weather-card .visibility-card > .card-content {
  flex: 1 1 auto;
  justify-content: flex-start;
}

.weather-card .aqi-svg,
.weather-card .uv-svg {
  max-width: 254px !important;
}

.weather-card .visibility-svg {
  max-width: 226px !important;
}

.weather-card .aqi-number,
.weather-card .uv-number,
.weather-card .visibility-number {
  font-size: 52px !important;
  letter-spacing: -2px !important;
}

.weather-card .aqi-text-badge,
.weather-card .uv-text-badge,
.weather-card .visibility-text-badge,
.weather-card .header-badge {
  font-size: 13px !important;
  padding: 5px 12px !important;
}

.weather-card .aqi-index-label,
.weather-card .uv-index-label,
.weather-card .visibility-index-label,
.weather-card .detail-label,
.weather-card .stat-label,
.weather-card .tbox-label,
.weather-card .component-name {
  font-size: 11.5px !important;
}

.weather-card .detail-value,
.weather-card .stat-value,
.weather-card .tbox-value,
.weather-card .component-value {
  font-size: 16px !important;
}

.weather-card .stats-info h3,
.weather-card .protection-title,
.weather-card .summary-title,
.weather-card .tips-title {
  font-size: 15px !important;
}

.weather-card .stats-info p,
.weather-card .protection-list li,
.weather-card .tips-list li,
.weather-card .summary-body p,
.weather-card .aqi-info,
.weather-card .rcb-left {
  font-size: 13.5px !important;
  line-height: 1.45 !important;
}

.weather-card .detail-icon,
.weather-card .stat-icon {
  width: 36px !important;
  height: 36px !important;
}

.weather-card .detail-icon i,
.weather-card .stat-icon i,
.weather-card .tbox-icon i {
  font-size: 14px !important;
}

.weather-card .precipitation-card .ring-wrap {
  width: min(180px, 66%) !important;
}

.weather-card .ring-val {
  font-size: 25px !important;
}

.weather-card .sun-arc-svg {
  max-width: 330px !important;
}

.card-grid > .detail-card .uv-details,
.card-grid > .detail-card .forecast-section,
.card-grid > .detail-card .visibility-bottom-grid {
  display: none !important;
}

.card-grid > .detail-card .uv-index-card > .card-content,
.card-grid > .detail-card .precipitation-card > .card-content,
.card-grid > .detail-card .visibility-card > .card-content {
  min-height: calc(500px - 60px);
  justify-content: center !important;
}

.card-grid > .detail-card .precipitation-card > .card-content {
  min-height: auto;
  justify-content: flex-start !important;
  gap: 14px !important;
  padding-top: 18px !important;
  padding-bottom: 18px !important;
}

.card-grid > .detail-card .precipitation-card .precip-top {
  gap: 14px !important;
}

.card-grid > .detail-card .precipitation-card .ring-wrap {
  width: min(158px, 58%) !important;
}

.card-grid > .detail-card .precipitation-card .stat-grid {
  gap: 8px !important;
}

.card-grid > .detail-card .precipitation-card .stat-item,
.card-grid > .detail-card .precipitation-card .rain-chance-bar {
  padding: 11px 12px !important;
}

.card-grid > .detail-card .precipitation-card .stat-icon {
  width: 32px !important;
  height: 32px !important;
}

.card-grid > .detail-card .uv-protection,
.card-grid > .detail-card .rain-chance-bar,
.card-grid > .detail-card .visibility-summary {
  width: 100%;
}

.weather-card .weather-stats-card > .stats-grid,
.weather-card .sun-card > .sun-content {
  flex: 1 1 auto;
}

.weather-card .uv-index-card > .card-header,
.weather-card .precipitation-card > .card-header,
.weather-card .visibility-card > .card-header,
.weather-card .forecast-header,
.weather-card .hourly-header {
  display: none !important;
}

.weather-card .forecast-body,
.weather-card .forecast-loading,
.weather-card .hourly-forecast-scroll,
.weather-card .hourly-loading {
  background: transparent !important;
}

.weather-card .forecast-body,
.weather-card .hourly-forecast-scroll {
  padding: 18px !important;
}

.weather-card .forecast-item,
.weather-card .hourly-card,
.weather-card .highlight-card,
.weather-card .additional-card,
.weather-card .planner-section,
.weather-card .component-item,
.weather-card .detail-item,
.weather-card .time-box,
.weather-card .stat-item {
  border-radius: var(--radius-sm) !important;
}

.weather-card .component-item,
.weather-card .detail-item,
.weather-card .time-box,
.weather-card .stat-item,
.weather-card .uv-protection,
.weather-card .visibility-summary,
.weather-card .visibility-tips,
.weather-card .rain-chance-bar {
  padding: 14px !important;
}

.weather-card .forecast-item,
.weather-card .hourly-card,
.weather-card .highlight-card,
.weather-card .additional-card,
.weather-card .planner-section,
.weather-card .component-item,
.weather-card .stat-item {
  box-shadow: none !important;
  border: 1px solid var(--border) !important;
  background: var(--bg-card-alt) !important;
}

.weather-card .forecast-item:hover,
.weather-card .hourly-card:hover,
.weather-card .highlight-card:hover,
.weather-card .component-item:hover,
.weather-card .stat-item:hover {
  transform: translateY(-2px) !important;
  box-shadow: none !important;
}

.weather-card .map-container {
  min-height: 460px;
}

.weather-card .map-controls,
.weather-card .map-legend,
.weather-card .map-footer {
  background: var(--bg-card-alt) !important;
  border-color: var(--border) !important;
}

.weather-card .layer-btn.active,
.weather-card .unit-btn.active,
.weather-card .refresh-button {
  background: var(--accent) !important;
  border-color: var(--accent) !important;
  color: var(--text-on-accent) !important;
  box-shadow: none !important;
}

.weather-card .layer-btn,
.weather-card .unit-btn,
.weather-card .scroll-btn {
  border-radius: var(--radius-sm) !important;
}

.weather-card .uv-protection-card,
.weather-card .precipitation-info-card,
.weather-card .visibility-info-card,
.weather-card .detail-item,
.weather-card .seasonal-tip,
.weather-card .best-activity-window {
  background: var(--bg-card-alt) !important;
  border: 1px solid var(--border) !important;
}

.weather-card .highlight-title,
.weather-card .additional-header h3,
.weather-card .stats-info h3,
.weather-card .forecast-day,
.weather-card .hour-time,
.weather-card .section-header h3,
.weather-card .region-name,
.weather-card .protection-title,
.weather-card .info-content h4,
.weather-card .forecast-title,
.weather-card .tips-title {
  color: var(--text-primary) !important;
  background: none !important;
  -webkit-text-fill-color: currentColor !important;
}

.weather-card .highlight-value,
.weather-card .additional-value,
.weather-card .stat-value,
.weather-card .forecast-temp,
.weather-card .hour-temp,
.weather-card .detail-value,
.weather-card .period-temp,
.weather-card .window-time {
  color: var(--text-primary) !important;
}

.weather-card .highlight-title,
.weather-card .additional-card,
.weather-card .stats-info p,
.weather-card .forecast-date,
.weather-card .forecast-desc,
.weather-card .hour-day,
.weather-card .hour-description,
.weather-card .detail-label,
.weather-card .info-content p,
.weather-card .tips-list li,
.weather-card .seasonal-tip,
.weather-card .region-advice {
  color: var(--text-secondary) !important;
}

.detail-modal .uv-index-card,
.detail-modal .precipitation-card,
.detail-modal .visibility-card {
  box-shadow: none !important;
  border: 0 !important;
  background: transparent !important;
}

.detail-modal .uv-index-card > .card-header,
.detail-modal .precipitation-card > .card-header,
.detail-modal .visibility-card > .card-header {
  display: none !important;
}

@media (max-width: 1180px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 840px) {
  .search-header {
    top: 56px;
  }

  .search-header-inner,
  .search-tools {
    grid-template-columns: 1fr;
  }

  .station-copy h1 {
    font-size: 30px;
  }

  .units-toggle {
    width: fit-content;
  }

  .quick-strip {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .search-header-inner,
  .location-bar,
  .content,
  .site-footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .card-grid,
  .quick-strip {
    grid-template-columns: 1fr;
  }

  .alert-banner {
    width: calc(100% - 32px);
  }

  .bottom-nav {
    justify-content: space-around;
  }

  .bnav-btn {
    min-width: 0;
    padding-inline: 10px;
  }
}
</style>
