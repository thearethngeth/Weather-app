import { computed } from 'vue';
import { useStore } from 'vuex';
import { t, translateWeatherDesc } from './translations';

export function useTranslation() {
  const store = useStore();
  const lang = computed(() => store.state.language);

  const $t = (key) => t(lang.value, key);
  const $tw = (desc) => translateWeatherDesc(lang.value, desc);

  const toggleLanguage = () => {
    store.commit('SET_LANGUAGE', lang.value === 'en' ? 'km' : 'en');
  };

  return { lang, $t, $tw, toggleLanguage };
}
