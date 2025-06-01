import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zhHans from './locales/zh-Hans.json'
import zhHant from './locales/zh-Hant.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import fr from './locales/fr.json'
import es from './locales/es.json'
import de from './locales/de.json'

const messages = {
  en,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  ja,
  ko,
  fr,
  es,
  de
}

// 获取默认语言
const getDefaultLanguage = () => {
  const savedLanguage = localStorage.getItem('userLanguage')
  if (savedLanguage) return savedLanguage
  let lang = "en";
  const browserLanguage = navigator.language || 'en'
  if (browserLanguage.startsWith('zh')) {
    lang=browserLanguage.includes('TW') || browserLanguage.includes('HK') ? 'zh-Hant' : 'zh-Hans'
  }
  localStorage.setItem('userLanguage', lang);
  return lang
}

// 创建并导出i18n实例
export const i18n = createI18n({
  legacy: false,
  locale: getDefaultLanguage(),
  fallbackLocale: 'en',
  warnHtmlMessage: false,
  messages,
  datetimeFormats: {
    'en': {
      short: {
        year: 'numeric', month: 'short', day: 'numeric'
      }
    },
    'zh-Hans': {
      short: {
        year: 'numeric', month: 'short', day: 'numeric'
      }
    },
    'zh-Hant': {
      short: {
        year: 'numeric', month: 'short', day: 'numeric'
      }
    },
    'ja': {
      short: {
        year: 'numeric', month: 'short', day: 'numeric'
      }
    }
  },
  numberFormats: {
    'en': {
      currency: {
        style: 'currency', currency: 'USD'
      }
    },
    'zh-Hans': {
      currency: {
        style: 'currency', currency: 'CNY'
      }
    },
    'zh-Hant': {
      currency: {
        style: 'currency', currency: 'TWD'
      }
    },
    'ja': {
      currency: {
        style: 'currency', currency: 'JPY'
      }
    }
  }
})

export function updateDocumentTitle() {
  document.title = i18n.global.t('app.documentTitle')
}

// 初始化设置标题
updateDocumentTitle()