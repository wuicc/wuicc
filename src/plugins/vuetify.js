import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.min.css'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#ffc0cb',    // 粉色作为主色
          primary_dark: '#f08d9e',
          secondary: '#f5f5f5',  // 浅灰色作为次色
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
          primary: '#ffc0cb',    // 保持粉色主色
          primary_dark: '#f08d9e',
          secondary: '#424242',  // 深灰色作为次色
          accent: '#00b0ff',     // 保持蓝色强调色
          error: '#ff5252',
          info: '#00b0ff',
          success: '#4caf50',
          warning: '#ff8c00'
        }
      }
    }
  }
})