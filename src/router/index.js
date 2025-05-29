import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layouts/Layout.vue'
import Home from '../views/Home.vue'
import Page1 from '../views/Page1.vue'
import Page2 from '../views/Page2.vue'
import Page3 from '../views/Page3.vue'
import Shortcuts from '../views/Shortcuts.vue'
import NotFound from '../views/NotFound.vue'
import About from '../views/About.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', name: 'Home', component: Home },
      { path: 'timeline', name: 'Timeline', component: Page1 },
      { path: 'notification', name: 'Notification', component: Page2 },
      { path: 'settings', name: 'Settings', component: Page3 },
      { path: 'shortcuts', name: 'Shortcuts', component: Shortcuts },
      { path: 'about',name: 'About',component: About},
      { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router