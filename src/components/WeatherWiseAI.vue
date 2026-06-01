<!-- src/components/WeatherWiseAI.vue -->
<template>
  <div class="weatherwise-ai-floating">
    <!-- Floating button -->
    <button class="floating-chat-btn" @click="toggleChat" :class="{ active: isOpen }">
      <i class="fas fa-robot" v-if="!isOpen"></i>
      <i class="fas fa-times" v-else></i>
    </button>

    <!-- Chat window -->
    <transition name="slide-fade">
      <div v-if="isOpen" class="chat-window">
        <div class="chat-header">
          <div class="header-content">
            <div class="ai-logo">
              <i class="fas fa-brain"></i>
            </div>
            <div class="header-info">
              <h3>{{ uiCopy.assistantName }}</h3>
              <p><span class="pulse-dot"></span> {{ uiCopy.assistantSubtitle }}</p>
            </div>
          </div>
          <div class="lang-switcher">
            <button class="lang-btn" :class="{ active: selectedLanguage === 'en' }" @click="setLanguage('en')">EN</button>
            <button class="lang-btn" :class="{ active: selectedLanguage === 'km' }" @click="setLanguage('km')">ខ្មែរ</button>
          </div>
          <button @click="clearChat" class="clear-btn" title="Clear"><i class="fas fa-redo-alt"></i></button>
        </div>

        <div class="messages-container" ref="messagesContainer">
          <div v-if="messages.length === 0" class="welcome-screen">
            <div class="welcome-animation"><i class="fas fa-robot"></i></div>
            <h2>{{ uiCopy.welcomeTitle }} 👋</h2>
            <p>{{ uiCopy.welcomeText }}</p>
            <div class="example-questions">
              <p class="examples-title">{{ uiCopy.tryPrompt }}</p>
              <button v-for="(ex, idx) in exampleQuestions" :key="idx" @click="askExample(ex)" class="example-btn">
                <i :class="ex.icon"></i> {{ ex.text }}
              </button>
            </div>
          </div>
          <div v-for="(msg, idx) in messages" :key="idx" :class="['message', msg.sender]">
            <div class="message-row">
              <div v-if="msg.sender === 'ai'" class="avatar ai-avatar"><i class="fas fa-robot"></i></div>
              <div class="message-bubble">
                <div class="bubble-content" v-html="formatText(msg.text)"></div>
                <span class="timestamp">{{ msg.timestamp }}</span>
              </div>
              <div v-if="msg.sender === 'user'" class="avatar user-avatar"><i class="fas fa-user-circle"></i></div>
            </div>
          </div>
          <div v-if="isThinking" class="message ai">
            <div class="message-row">
              <div class="avatar ai-avatar"><i class="fas fa-robot"></i></div>
              <div class="thinking-bubble"><div class="thinking-dots"><span></span><span></span><span></span></div></div>
            </div>
          </div>
        </div>

        <div class="input-section">
          <div class="input-container">
            <input v-model="userMessage" @keypress.enter="sendMessage" :disabled="isThinking" type="text" class="chat-input" :placeholder="uiCopy.inputPlaceholder" ref="chatInput" />
            <button @click="sendMessage" :disabled="!userMessage.trim() || isThinking" :class="['send-btn', { active: userMessage.trim() }]">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, nextTick } from 'vue';
import { useStore } from 'vuex';
import moment from 'moment';
import { getWeatherAssistantReply } from '@/services/aiAssistantService';
import { getUICopy, LanguageCode, isHistoricalQuery } from '@/services/translationService';

export default {
  name: 'WeatherWiseAI',
  setup() {
    const store = useStore();
    const isOpen = ref(false);
    const messages = ref([]);
    const userMessage = ref('');
    const isThinking = ref(false);
    const messagesContainer = ref(null);
    const chatInput = ref(null);
    const selectedLanguage = ref(LanguageCode.ENGLISH);

    const uiCopy = computed(() => getUICopy(selectedLanguage.value));
    const weather = computed(() => store.state.weather);
    const forecast = computed(() => store.state.forecast);
    const units = computed(() => store.state.units || 'metric');

    const exampleQuestions = computed(() => {
      if (selectedLanguage.value === LanguageCode.KHMER) {
        return [
          { text: 'ថ្ងៃនេះអាកាសធាតុយ៉ាងមិច?', icon: 'fas fa-sun' },
          { text: 'ខ្ញុំគួរពាក់អ្វីថ្ងៃនេះ?', icon: 'fas fa-tshirt' },
          { text: 'ស្អែកមានភ្លៀងទេ?', icon: 'fas fa-cloud-rain' },
        ];
      }
      return [
        { text: "What's the weather today?", icon: 'fas fa-sun' },
        { text: 'What should I wear today?', icon: 'fas fa-tshirt' },
        { text: 'Will it rain tomorrow?', icon: 'fas fa-cloud-rain' },
      ];
    });

    const toggleChat = () => { isOpen.value = !isOpen.value; if(isOpen.value) nextTick(() => chatInput.value?.focus()); };
    const setLanguage = (lang) => { selectedLanguage.value = lang; };
    const addMessage = (sender, text) => {
      messages.value.push({ sender, text, timestamp: moment().format('h:mm A') });
      nextTick(() => { if(messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight; });
    };
    const formatText = (text) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    const askExample = (example) => { userMessage.value = example.text; sendMessage(); };
    const clearChat = () => { if(confirm(uiCopy.value.clearConfirm)) messages.value = []; };

    const sendMessage = async () => {
      const msg = userMessage.value.trim();
      if (!msg || isThinking.value) return;
      addMessage('user', msg);
      userMessage.value = '';
      isThinking.value = true;

      try {
        if (isHistoricalQuery(msg)) {
          addMessage('ai', uiCopy.value.outOfScopeHistorical);
        } else {
          const result = await getWeatherAssistantReply({
            userMessage: msg,
            preferredLanguage: selectedLanguage.value,
            weather: weather.value,
            forecast: forecast.value,
            units: units.value,
            conversationHistory: messages.value
          });
          addMessage('ai', result.response);
        }
      } catch (error) {
        console.error(error);
        addMessage('ai', `❌ ${uiCopy.value.sendError}`);
      } finally {
        isThinking.value = false;
      }
    };

    return {
      isOpen, messages, userMessage, isThinking, messagesContainer, chatInput, selectedLanguage, uiCopy,
      exampleQuestions, toggleChat, setLanguage, addMessage, formatText, askExample, clearChat, sendMessage
    };
  }
};
</script>

<style scoped>
.weatherwise-ai-floating {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
.floating-chat-btn {
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  color: white;
  font-size: 1.8rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.floating-chat-btn:hover { transform: scale(1.05); }
.chat-window {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 380px;
  height: 550px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 35px -10px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeInUp 0.2s ease;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-content { display: flex; align-items: center; gap: 8px; }
.ai-logo i { font-size: 1.5rem; }
.header-info h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
.header-info p { margin: 0; font-size: 0.7rem; opacity: 0.9; display: flex; align-items: center; gap: 6px; }
.pulse-dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; display: inline-block; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
.lang-switcher { display: flex; gap: 4px; background: rgba(255,255,255,0.15); padding: 4px; border-radius: 20px; }
.lang-btn { background: none; border: none; color: white; font-size: 0.7rem; font-weight: bold; padding: 4px 8px; border-radius: 16px; cursor: pointer; }
.lang-btn.active { background: white; color: #667eea; }
.clear-btn { background: rgba(255,255,255,0.2); border: none; width: 32px; height: 32px; border-radius: 16px; color: white; cursor: pointer; }
.messages-container { flex: 1; overflow-y: auto; padding: 16px; background: #f8fafc; display: flex; flex-direction: column; gap: 12px; }
.message { display: flex; flex-direction: column; }
.message-row { display: flex; gap: 8px; align-items: flex-start; }
.message.user .message-row { flex-direction: row-reverse; }
.avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #e2e8f0; }
.ai-avatar { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
.user-avatar { background: #f97316; color: white; }
.message-bubble { max-width: 75%; padding: 8px 12px; border-radius: 18px; background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.message.user .message-bubble { background: #667eea; color: white; }
.bubble-content { font-size: 0.85rem; line-height: 1.4; }
.timestamp { font-size: 0.6rem; opacity: 0.6; display: block; margin-top: 4px; }
.thinking-bubble { background: #f1f5f9; padding: 12px 16px; border-radius: 20px; }
.thinking-dots { display: flex; gap: 4px; }
.thinking-dots span { width: 6px; height: 6px; background: #667eea; border-radius: 50%; animation: bounce 1.2s infinite; }
.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,60%,100%{ transform: translateY(0); } 30%{ transform: translateY(-6px); } }
.input-section { padding: 12px; background: white; border-top: 1px solid #e2e8f0; }
.input-container { display: flex; gap: 8px; align-items: center; background: #f1f5f9; border-radius: 30px; padding: 4px 8px; }
.chat-input { flex: 1; border: none; background: transparent; padding: 8px 4px; outline: none; font-size: 0.85rem; }
.send-btn { width: 34px; height: 34px; border-radius: 17px; background: #e2e8f0; border: none; color: #94a3b8; cursor: pointer; transition: 0.2s; }
.send-btn.active { background: #667eea; color: white; }
.welcome-screen { text-align: center; padding: 20px; }
.welcome-animation i { font-size: 3rem; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; background-clip: text; color: transparent; }
.example-btn { background: white; border: 1px solid #cbd5e1; border-radius: 20px; padding: 6px 12px; margin: 4px; font-size: 0.75rem; cursor: pointer; transition: 0.2s; }
.example-btn:hover { background: #667eea; color: white; border-color: #667eea; }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.2s; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translateY(20px); }
@media (max-width: 500px) {
  .chat-window { width: 320px; height: 500px; right: -10px; }
}
</style>
