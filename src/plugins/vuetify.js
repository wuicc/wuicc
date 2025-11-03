import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { useI18n } from 'vue-i18n'
import { i18n } from "@/i18n";

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    sets: {}
  },
  defaults: {
    VImg: {
      transition: false, // 禁用过渡
    }
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#ffc0cb',    // 粉色作为主色
          primary_dark: '#ff879d',
          secondary: '#888',  // 浅灰色作为次色
          accent: '#00b0ff',     // 蓝色作为强调色
          error: '#ff5252',      // 错误红色
          info: '#00b0ff',       // 信息蓝色
          success: '#4caf50',    // 成功绿色
          warning: '#ff8c00'     // 警告黄色
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: '#e7a3b0',      // #ffc0cb → 80% 亮度
          primary_dark: '#ff879d',
          secondary: '#aaa',   // #888 → 80% 亮度
          accent: '#08a4ec',      // #00b0ff → 80% 亮度 
          error: '#cc4242',       // #ff5252 → 80% 亮度
          info: '#008ccc',        // #00b0ff → 80% 亮度
          success: '#3d8c40',     // #4caf50 → 80% 亮度
          warning: '#cc7000',     // #ff8c00 → 80% 亮度
        }
      }
    }
  }
})