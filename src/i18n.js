import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import StorageManager from '@/utils/StorageManager'
import LanguageStorageManager from '@/utils/LanguageStorageManager'

// 基础消息对象 - 只包含英语作为默认语言
const messages = {
  en
}

// 动态加载游戏特定翻译
export const loadGameTranslations = async (gameId, locale) => {
  try {
    const gameTranslations = await import(`./locales/games/${gameId}/${locale}.json`)
    messages[locale] = {
      ...messages[locale],
      app: {
        ...messages[locale].app,
        pages: {
          ...messages[locale].app?.pages,
          gacha: {
            ...messages[locale].app?.pages?.gacha,
            items: {
              ...messages[locale].app?.pages?.gacha?.items,
              [gameId]: gameTranslations.default
            }
          }
        }
      }
    }
    i18n.global.mergeLocaleMessage(locale, messages[locale])
  } catch (error) {
    // console.error(`Failed to load ${gameId} ${locale} translations:`, error)
  }
}

// 动态加载语言文件
export const loadLanguage = async (locale) => {
  // 如果是英语或者语言已经加载，则直接返回
  if (locale === 'en' || messages[locale]) {
    return messages[locale]
  }
  
  try {
    // 使用LanguageStorageManager获取语言文件
    const languageData = await LanguageStorageManager.getOrDownloadLanguageFile(locale)
    
    // 存储语言数据
    messages[locale] = languageData
    
    // 合并到i18n实例
    i18n.global.mergeLocaleMessage(locale, languageData)
    
    return languageData
  } catch (error) {
    console.error(`Failed to load language ${locale}:`, error)
    throw error
  }
}

// 获取默认语言
const getDefaultLanguage = () => {
  const savedLanguage = StorageManager.get('userLanguage')
  if (savedLanguage) return savedLanguage
  let lang = "en";
  const browserLanguage = navigator.language || 'en'
  if (browserLanguage.startsWith('zh')) {
    lang=browserLanguage.includes('TW') || browserLanguage.includes('HK') ? 'zh-Hant' : 'zh-Hans'
  }
  StorageManager.set('userLanguage', lang);
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

export function updateDocumentTitle(subtitle = '') {
  const mainTitle = i18n.global.t('app.documentTitle');
  if (isPWA()) {
    document.title = subtitle || mainTitle;
  } else {
    document.title = subtitle ? `${subtitle} - ${mainTitle}` : mainTitle;
  }
}

export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.matchMedia('(display-mode: fullscreen)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches;
};

// 导出函数，供main.js在语言加载完成后调用
export async function initializeAppTitle() {
  updateDocumentTitle()
}

// 不在这里直接调用updateDocumentTitle，而是由main.js在语言加载完成后调用