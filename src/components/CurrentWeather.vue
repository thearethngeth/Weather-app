<template>
  <div class="cw-card" v-if="weatherData">
    <div class="cw-hero">
      <div class="cw-left">
        <div class="cw-date-row">
          <span class="cw-date">{{ formattedDate }}</span>
          <span class="cw-update"><i class="fas fa-circle-dot"></i> {{ lastUpdateTime }}</span>
        </div>
        <div class="cw-temp">{{ weatherData.weather.temp }}<span class="deg">&deg;</span></div>
        <div class="cw-desc">{{ weatherData.weather.description }}</div>
        <div class="cw-loc"><i class="fas fa-map-marker-alt"></i> {{ weatherData.name }}, {{ weatherData.sys.country }}</div>
        <div class="cw-range">
          <span><i class="fas fa-arrow-down"></i> {{ weatherData.main.temp_min }}&deg;</span>
          <span><i class="fas fa-arrow-up"></i> {{ weatherData.main.temp_max }}&deg;</span>
          <span class="cw-feels">Feels like {{ weatherData.main.feels_like }}&deg;</span>
        </div>
      </div>
      <div class="cw-icon-wrap">
        <img :src="getWeatherIcon(weatherData.weather.icon)" :alt="weatherData.weather.description" class="cw-icon" />
        <span class="cw-daytime" :class="{ night: isNightTime }">{{ isNightTime ? 'Night' : 'Day' }}</span>
      </div>
    </div>

    <div class="cw-stats">
      <div class="cw-stat">
        <i class="fas fa-wind"></i>
        <span class="stat-val">{{ weatherData.wind.speed }} m/s</span>
        <span class="stat-lbl">Wind</span>
      </div>
      <div class="cw-stat">
        <i class="fas fa-droplet"></i>
        <span class="stat-val">{{ weatherData.main.humidity }}%</span>
        <span class="stat-lbl">Humidity</span>
      </div>
      <div class="cw-stat">
        <i class="fas fa-gauge-high"></i>
        <span class="stat-val">{{ weatherData.main.pressure }}</span>
        <span class="stat-lbl">Pressure</span>
      </div>
      <div class="cw-stat">
        <i class="fas fa-eye"></i>
        <span class="stat-val">{{ formatVisibility }}</span>
        <span class="stat-lbl">Visibility</span>
      </div>
    </div>
  </div>

  <div class="cw-loading" v-else>
    <div class="loading-scene">
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
      <div class="cloud cloud-3"></div>
      <div class="sun"></div>
      <div class="raindrop" v-for="n in 8" :key="n"></div>
    </div>
    <i class="fas fa-cloud-sun fa-pulse cw-load-icon"></i>
    <p class="cw-load-text">Fetching weather data...</p>
  </div>
</template>

<script>
export default {
  data() { return { weatherData: null, lastUpdate: null } },
  computed: {
    storeWeather() { return this.$store.state.weather },
    formatVisibility() {
      if (!this.weatherData?.visibility) return 'N/A'
      return `${(this.weatherData.visibility / 1000).toFixed(1)} km`
    },
    formattedDate() {
      return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    },
    lastUpdateTime() {
      if (!this.lastUpdate) return 'Just now'
      const m = Math.floor((new Date() - this.lastUpdate) / 60000)
      if (m < 1) return 'Updated just now'
      if (m === 1) return '1 min ago'
      if (m < 60) return `${m} mins ago`
      const h = Math.floor(m / 60)
      return h === 1 ? '1 hour ago' : `${h} hours ago`
    },
    isNightTime() {
      const hour = new Date().getHours();
      return hour < 6 || hour >= 18;
    }
  },
  watch: {
    storeWeather: {
      handler(w) { if (w) { this.updateWeatherData(w); this.lastUpdate = new Date() } },
      immediate: true,
      deep: true
    }
  },
  mounted() {
    // Fallback: if store already has data when component mounts, use it directly
    if (this.$store.state.weather) {
      this.updateWeatherData(this.$store.state.weather)
      this.lastUpdate = new Date()
    }
  },
  methods: {
    updateWeatherData(w) {
      if (!w) return
      this.weatherData = {
        weather: { temp: Math.round(w.main.temp), description: w.weather[0].description, icon: w.weather[0].icon },
        name: w.name, sys: w.sys,
        main: { temp_min: Math.round(w.main.temp_min), temp_max: Math.round(w.main.temp_max), feels_like: Math.round(w.main.feels_like), humidity: w.main.humidity, pressure: w.main.pressure },
        wind: w.wind, visibility: w.visibility
      }
    },
    getWeatherIcon(icon) {
      const map = { '01d':'clear-day','01n':'clear-night','02d':'few-clouds-day','02n':'few-clouds-night','03d':'cloudy','03n':'cloudy','04d':'cloudy','04n':'cloudy','09d':'rain','09n':'rain','10d':'rain-day','10n':'rain-night','11d':'thunderstorm','11n':'thunderstorm','13d':'snow','13n':'snow','50d':'mist','50n':'mist' }
      return this.getCustomIconSVG(map[icon] || 'clear-day')
    },
    getCustomIconSVG(iconType) {
      const icons = {
        'clear-day': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sg" cx="50%" cy="50%" r="50%"><stop offset="0%" style="stop-color:#FDB813"/><stop offset="100%" style="stop-color:#F59E0B"/></radialGradient></defs><circle cx="100" cy="100" r="35" fill="url(#sg)"/><g stroke="#F59E0B" stroke-width="6" stroke-linecap="round"><line x1="100" y1="30" x2="100" y2="45"/><line x1="100" y1="155" x2="100" y2="170"/><line x1="30" y1="100" x2="45" y2="100"/><line x1="155" y1="100" x2="170" y2="100"/><line x1="51" y1="51" x2="62" y2="62"/><line x1="138" y1="138" x2="149" y2="149"/><line x1="149" y1="51" x2="138" y2="62"/><line x1="62" y1="138" x2="51" y2="149"/></g></svg>`,
        'clear-night': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path d="M 120 50 Q 150 70,150 100 Q 150 130,120 150 Q 140 140,140 100 Q 140 60,120 50 Z" fill="#FBBF24"/><circle cx="90" cy="65" r="3" fill="#FFF" opacity="0.8"/><circle cx="140" cy="80" r="2" fill="#FFF" opacity="0.6"/><circle cx="75" cy="130" r="2.5" fill="#FFF" opacity="0.7"/></svg>`,
        'few-clouds-day': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="70" cy="60" r="25" fill="#FDB813"/><g stroke="#F59E0B" stroke-width="4" stroke-linecap="round"><line x1="70" y1="25" x2="70" y2="35"/><line x1="35" y1="60" x2="45" y2="60"/></g><ellipse cx="120" cy="110" rx="45" ry="35" fill="#CBD5E1"/><ellipse cx="90" cy="120" rx="40" ry="30" fill="#E2E8F0"/><ellipse cx="135" cy="125" rx="35" ry="28" fill="#F1F5F9"/></svg>`,
        'few-clouds-night': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path d="M 80 40 Q 100 50,100 70 Q 100 90,80 100 Q 95 92,95 70 Q 95 48,80 40 Z" fill="#FBBF24"/><ellipse cx="120" cy="110" rx="45" ry="35" fill="#94A3B8"/><ellipse cx="90" cy="120" rx="40" ry="30" fill="#CBD5E1"/><ellipse cx="135" cy="125" rx="35" ry="28" fill="#E2E8F0"/></svg>`,
        'cloudy': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><ellipse cx="100" cy="90" rx="55" ry="40" fill="#94A3B8"/><ellipse cx="65" cy="105" rx="45" ry="35" fill="#CBD5E1"/><ellipse cx="135" cy="105" rx="45" ry="35" fill="#CBD5E1"/><ellipse cx="100" cy="120" rx="50" ry="38" fill="#E2E8F0"/></svg>`,
        'rain': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><ellipse cx="100" cy="70" rx="50" ry="35" fill="#94A3B8"/><ellipse cx="70" cy="80" rx="40" ry="30" fill="#A1A1AA"/><ellipse cx="130" cy="80" rx="40" ry="30" fill="#A1A1AA"/><g stroke="#60A5FA" stroke-width="4" stroke-linecap="round" opacity="0.8"><line x1="70" y1="110" x2="65" y2="140"/><line x1="90" y1="115" x2="85" y2="145"/><line x1="110" y1="115" x2="105" y2="145"/><line x1="130" y1="110" x2="125" y2="140"/></g></svg>`,
        'rain-day': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="50" r="20" fill="#FDB813"/><ellipse cx="110" cy="80" rx="45" ry="32" fill="#94A3B8"/><ellipse cx="85" cy="90" rx="38" ry="28" fill="#A1A1AA"/><g stroke="#60A5FA" stroke-width="3.5" stroke-linecap="round"><line x1="85" y1="115" x2="80" y2="140"/><line x1="105" y1="120" x2="100" y2="145"/><line x1="125" y1="115" x2="120" y2="140"/></g></svg>`,
        'rain-night': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path d="M 70 35 Q 85 42,85 55 Q 85 68,70 75 Q 80 68,80 55 Q 80 42,70 35 Z" fill="#FBBF24"/><ellipse cx="110" cy="80" rx="45" ry="32" fill="#71717A"/><ellipse cx="85" cy="90" rx="38" ry="28" fill="#94A3B8"/><g stroke="#60A5FA" stroke-width="3.5" stroke-linecap="round"><line x1="85" y1="115" x2="80" y2="140"/><line x1="105" y1="120" x2="100" y2="145"/><line x1="125" y1="115" x2="120" y2="140"/></g></svg>`,
        'thunderstorm': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><ellipse cx="100" cy="65" rx="50" ry="35" fill="#52525B"/><ellipse cx="70" cy="75" rx="40" ry="30" fill="#71717A"/><ellipse cx="130" cy="75" rx="40" ry="30" fill="#71717A"/><path d="M 105 95 L 90 120 L 105 120 L 95 145 L 125 115 L 110 115 L 115 95 Z" fill="#FCD34D" stroke="#F59E0B" stroke-width="2"/></svg>`,
        'snow': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><ellipse cx="100" cy="70" rx="50" ry="35" fill="#DBEAFE"/><ellipse cx="70" cy="80" rx="40" ry="30" fill="#EFF6FF"/><ellipse cx="130" cy="80" rx="40" ry="30" fill="#EFF6FF"/><g fill="#93C5FD"><circle cx="70" cy="115" r="4"/><circle cx="90" cy="125" r="5"/><circle cx="110" cy="120" r="4.5"/><circle cx="130" cy="130" r="5"/><circle cx="80" cy="140" r="4"/><circle cx="120" cy="145" r="4.5"/></g></svg>`,
        'mist': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g stroke="#94A3B8" stroke-width="8" stroke-linecap="round" opacity="0.6"><line x1="50" y1="70" x2="150" y2="70"/><line x1="40" y1="90" x2="160" y2="90"/><line x1="55" y1="110" x2="145" y2="110"/><line x1="45" y1="130" x2="155" y2="130"/></g></svg>`
      }
      return `data:image/svg+xml;base64,${btoa(icons[iconType] || icons['clear-day'])}`
    }
  }
}
</script>

<style scoped>
/* ── Card wrapper ── */
.cw-card {
  background: linear-gradient(150deg, #e8f4fd 0%, #eef5fb 55%, #f2f0fb 100%);
  width: 100%;
  padding: 28px 32px 20px;
  position: relative;
}

body.dark-theme .cw-card {
  background: linear-gradient(150deg, #162640 0%, #1a2e48 55%, #1e2840 100%);
}

/* ── Hero row ── */
.cw-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.cw-left { flex: 1; }

.cw-date-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.cw-date {
  font-size: 13px;
  font-weight: 500;
  color: var(--sky-500, #2e6fa3);
}

.cw-update {
  font-size: 11px;
  color: var(--text-muted, #8aa0b0);
  i { font-size: 8px; margin-right: 4px; color: #5cb87a; }
}

.cw-temp {
  font-size: 80px;
  font-weight: 300;
  color: #1a3c5a;
  line-height: 1;
  letter-spacing: -3px;
  margin-bottom: 6px;
  sup { font-size: 36px; font-weight: 400; vertical-align: top; margin-top: 16px; }
  .deg { font-size: 36px; font-weight: 300; vertical-align: super; line-height: 1; }
}

body.dark-theme .cw-temp { color: #d0e8f8; }

.cw-desc {
  font-size: 20px;
  font-weight: 400;
  color: #2e5a7e;
  text-transform: capitalize;
  margin-bottom: 6px;
}

body.dark-theme .cw-desc { color: #7ab8d8; }

.cw-loc {
  font-size: 13px;
  color: #5a88a8;
  margin-bottom: 10px;
  i { margin-right: 5px; }
}

.cw-range {
  display: flex;
  gap: 14px;
  font-size: 13px;
  color: #6b9dc4;
}

.cw-feels { color: #8ab0c8; }

/* ── Icon ── */
.cw-icon-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.cw-icon {
  width: 140px;
  height: 140px;
  filter: drop-shadow(0 4px 12px rgba(74,144,196,0.2));
}

.cw-daytime {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 12px;
  border-radius: 12px;
  background: rgba(74,144,196,0.12);
  color: #4a90c4;
  margin-top: 8px;
  &.night { background: rgba(99,102,241,0.12); color: #818cf8; }
}

/* ── Stats row ── */
.cw-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 0.5px solid rgba(74,144,196,0.2);
  padding-top: 16px;
  gap: 0;
}

.cw-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border-right: 0.5px solid rgba(74,144,196,0.15);
  &:last-child { border-right: none; }

  i { font-size: 18px; color: #4a90c4; margin-bottom: 2px; }
  .stat-val { font-size: 15px; font-weight: 500; color: #1a3c5a; }
  .stat-lbl { font-size: 11px; color: #8aa0b0; }
}

body.dark-theme .cw-stat .stat-val { color: #c8dff0; }

/* ── Loading ── */
.cw-loading {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(150deg, #e8f4fd, #eef5fb);
  position: relative;
  overflow: hidden;
  gap: 16px;
  padding: 40px;
}

.loading-scene {
  position: relative;
  width: 180px;
  height: 120px;
  margin-bottom: 8px;
}

.sun {
  position: absolute;
  top: 15px;
  left: 70px;
  width: 50px;
  height: 50px;
  background: #fcd34d;
  border-radius: 50%;
  box-shadow: 0 0 30px rgba(252,211,77,0.6);
  animation: sunPulse 3s infinite ease-in-out;
}

.cloud {
  position: absolute;
  background: rgba(255,255,255,0.85);
  border-radius: 20px;
  &.cloud-1 { top:25px; left:90px; width:65px; height:26px; animation: cfloat1 7s infinite ease-in-out; }
  &.cloud-2 { top:45px; left:25px; width:55px; height:22px; animation: cfloat2 8s infinite ease-in-out; }
  &.cloud-3 { top:62px; left:110px; width:45px; height:18px; animation: cfloat3 6s infinite ease-in-out; }
}

.raindrop {
  position: absolute;
  width: 2px;
  height: 12px;
  background: linear-gradient(to bottom, transparent, rgba(74,144,196,0.7));
  border-radius: 0 0 4px 4px;
  bottom: 0;
  animation: rain 1.5s infinite ease-in;
  &:nth-child(4) { left:15%; animation-delay:.1s; }
  &:nth-child(5) { left:28%; animation-delay:.4s; }
  &:nth-child(6) { left:42%; animation-delay:.2s; }
  &:nth-child(7) { left:58%; animation-delay:.6s; }
  &:nth-child(8) { left:72%; animation-delay:.3s; }
  &:nth-child(9) { left:85%; animation-delay:.5s; }
  &:nth-child(10) { left:50%; animation-delay:.15s; }
  &:nth-child(11) { left:35%; animation-delay:.45s; }
}

.cw-load-icon { font-size: 2.5rem; color: #4a90c4; }
.cw-load-text { font-size: 14px; color: #6b9dc4; }

@keyframes sunPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
@keyframes cfloat1 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-18px)} }
@keyframes cfloat2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(18px)} }
@keyframes cfloat3 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-12px)} }
@keyframes rain { 0%{opacity:0;transform:translateY(-10px)} 50%{opacity:1} 100%{opacity:0;transform:translateY(60px)} }

/* ── Responsive ── */
@media (max-width: 600px) {
  .cw-card { padding: 20px 18px 16px; }
  .cw-temp { font-size: 60px; letter-spacing: -2px; }
  .cw-icon { width: 100px; height: 100px; }
  .cw-hero { gap: 12px; }
  .cw-desc { font-size: 16px; }
  .cw-stats { grid-template-columns: repeat(2, 1fr); }
  .cw-stat:nth-child(2) { border-right: none; }
  .cw-stat:nth-child(1), .cw-stat:nth-child(2) { border-bottom: 0.5px solid rgba(74,144,196,0.15); }
}
</style>
