import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import pinia from './store'
import { i18n, loadLanguage, initializeAppTitle } from './i18n' // 导入loadLanguage和initializeAppTitle函数
import LanguageStorageManager from '@/utils/LanguageStorageManager'
// 导入虚拟滚动相关
import VueVirtualScroller from 'vue-virtual-scroller';

// 设置全局referrer策略，让图片不发送referer
const setReferrerPolicy = () => {
  // 检查是否已存在referrer meta标签
  let referrerMeta = document.querySelector('meta[name="referrer"]');
  if (!referrerMeta) {
    referrerMeta = document.createElement('meta');
    referrerMeta.name = 'referrer';
    document.head.appendChild(referrerMeta);
  }
  // 设置为不发送referer
  referrerMeta.content = 'no-referrer';
}

// 检查并清除过时的语言缓存
function checkAndClearOutdatedLanguageCache() {
  // 检查是否有服务器提供的语言更新时间
  if (window.languageLastModified && typeof window.languageLastModified === 'object') {
    // 获取所有可用语言
    const availableLanguages = ['zh-Hans', 'zh-Hant', 'ja', 'ko', 'fr'];
    
    // 检查每种语言是否过时
    availableLanguages.forEach(locale => {
      if (LanguageStorageManager.isLanguageFileOutdated(locale)) {
        // console.log(`Clearing outdated language cache for: ${locale}`);
        LanguageStorageManager.clearLanguageCache(locale);
      }
    });
  }
}

// 异步初始化应用
async function initApp() {
  // 设置referrer策略，确保图片不发送referer
  setReferrerPolicy();
  
  // 检查并清除过时的语言缓存
  checkAndClearOutdatedLanguageCache();
  
  const app = createApp(App)

  // 使用插件
  app.use(pinia)
  app.use(vuetify)
  app.use(router)
  app.use(i18n)
  // 配置虚拟滚动插件
  app.use(VueVirtualScroller)

  // 获取当前设置的语言
  const currentLocale = i18n.global.locale.value

  // 如果不是英语（英语是直接导入的），检查是否有缓存，没有则预加载
  if (currentLocale !== 'en') {
    try {
      // 预加载默认语言文件
      await loadLanguage(currentLocale)
    } catch (error) {
      console.error('Failed to preload default language:', error)
      // 加载失败时，回退到英语
      i18n.global.locale.value = 'en'
    }
  }

  // 设置HTML语言属性
  document.documentElement.lang = i18n.global.locale.value

  // 在语言加载完成后初始化应用标题
  await initializeAppTitle()

  // 挂载应用
  app.mount('#app')
}

// 启动应用初始化
initApp()

