import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import { i18n } from './i18n' // 注意这里使用命名导入

const app = createApp(App)

// 使用插件
app.use(vuetify)
app.use(router)
app.use(i18n)

document.documentElement.lang = i18n.global.locale.value
app.mount('#app')

