<template>
  <div class="weather-highlights-container">
    <div v-if="weather" class="highlights-shell">
      <div class="highlights-grid">
        <article v-for="highlight in highlights" :key="highlight.title" class="highlight-card">
          <div class="highlight-icon">
            <i :class="highlight.icon"></i>
          </div>
          <div class="highlight-content">
            <span class="highlight-title">{{ highlight.title }}</span>
            <strong class="highlight-value">{{ highlight.value }}</strong>
          </div>
        </article>
      </div>

      <div class="condition-grid">
        <article class="condition-card">
          <div class="condition-head">
            <i class="fas fa-eye"></i>
            <span>{{ $t('visibilityLabel') }}</span>
          </div>
          <strong>{{ visibilityLabel }}</strong>
          <div class="meter">
            <span :style="{ width: `${visibilityPercent}%` }"></span>
          </div>
          <div class="meter-labels">
            <span>{{ $t('poor') }}</span>
            <span>{{ $t('clear') }}</span>
          </div>
        </article>

        <article class="condition-card">
          <div class="condition-head">
            <i class="fas fa-sun"></i>
            <span>{{ $t('uvIndexLabel') }}</span>
          </div>
          <strong>{{ uvLabel }}</strong>
          <div class="meter uv-meter">
            <span :style="{ width: `${uvPercent}%` }"></span>
          </div>
          <div class="meter-labels">
            <span>{{ $t('low') }}</span>
            <span>{{ $t('high') }}</span>
          </div>
        </article>
      </div>
    </div>

    <div v-else class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading weather highlights...</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "WeatherHighlights",
  computed: {
    lang() { return this.$store.state.language; },
    $t() {
      const { t } = require('@/i18n/translations');
      return (key) => t(this.lang, key);
    },
    weather() {
      return this.$store.state.weather;
    },
    uvIndex() {
      return this.$store.getters.uvIndex || 0;
    },
    highlights() {
      if (!this.weather) return [];
      const degree = String.fromCharCode(176);
      return [
        { title: this.$t('humidity'),   value: `${this.weather.main.humidity}%`,                            icon: "fas fa-droplet" },
        { title: this.$t('pressure'),   value: `${this.weather.main.pressure} hPa`,                         icon: "fas fa-gauge-high" },
        { title: this.$t('wind'),       value: `${Number(this.weather.wind.speed || 0).toFixed(1)} m/s`,    icon: "fas fa-wind" },
        { title: this.$t('feelsLike'),  value: `${Math.round(this.weather.main.feels_like)}${degree}C`,     icon: "fas fa-temperature-high" },
        { title: this.$t('cloudCover'), value: `${this.weather.clouds?.all ?? 0}%`,                         icon: "fas fa-cloud" },
        { title: this.$t('condition'),  value: this.weather.weather?.[0]?.main || "N/A",                    icon: "fas fa-cloud-sun" },
      ];
    },
    visibilityKm() {
      if (!this.weather?.visibility) return 0;
      return this.weather.visibility / 1000;
    },
    visibilityLabel() {
      if (!this.weather?.visibility) return "N/A";
      return `${this.visibilityKm.toFixed(1)} km`;
    },
    visibilityPercent() {
      return Math.min(100, Math.max(0, (this.visibilityKm / 10) * 100));
    },
    uvLabel() {
      const value = Number(this.uvIndex).toFixed(1);
      if (this.uvIndex <= 2) return `${value} Low`;
      if (this.uvIndex <= 5) return `${value} Moderate`;
      if (this.uvIndex <= 7) return `${value} High`;
      if (this.uvIndex <= 10) return `${value} Very High`;
      return `${value} Extreme`;
    },
    uvPercent() {
      return Math.min(100, Math.max(0, (this.uvIndex / 11) * 100));
    },
  },
};
</script>

<style scoped>
.weather-highlights-container {
  width: 100%;
  padding: 18px;
}

.highlights-shell {
  display: grid;
  gap: 14px;
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.highlight-card,
.condition-card {
  border: 1px solid var(--border, rgba(52, 116, 140, 0.16));
  border-radius: var(--radius-sm, 8px);
  background: var(--bg-card-alt, #f7fbfc);
}

.highlight-card {
  min-width: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 14px;
}

.highlight-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--accent-light, #e4f1f5);
  color: var(--accent-dark, #24586d);
}

.highlight-icon i {
  font-size: 16px;
}

.highlight-content {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.highlight-title,
.condition-head,
.meter-labels {
  color: var(--text-muted, #899aa3);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.highlight-value {
  min-width: 0;
  color: var(--text-primary, #17242b);
  font-size: 18px;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.condition-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.condition-card {
  padding: 16px;
  display: grid;
  gap: 10px;
}

.condition-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.condition-head i {
  color: var(--accent-dark, #24586d);
}

.condition-card strong {
  color: var(--text-primary, #17242b);
  font-size: 24px;
  line-height: 1;
}

.meter {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(52, 116, 140, 0.12);
}

.meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent, #34748c);
  transition: width 0.4s ease;
}

.uv-meter span {
  background: #d89b3d;
}

.meter-labels {
  display: flex;
  justify-content: space-between;
  letter-spacing: 0;
  text-transform: none;
}

.loading-state {
  min-height: 220px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  color: var(--text-secondary, #50646f);
}

.loading-spinner {
  width: 34px;
  height: 34px;
  border: 3px solid rgba(52, 116, 140, 0.16);
  border-top-color: var(--accent, #34748c);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-state p {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .highlights-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .weather-highlights-container {
    padding: 14px;
  }

  .highlights-grid,
  .condition-grid {
    grid-template-columns: 1fr;
  }
}
</style>
