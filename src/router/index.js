import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layouts/Layout.vue'
import Home from '../views/Home.vue'
import Page1 from '../views/Page1.vue'
import Page2 from '../views/Page2.vue'
import Page3 from '../views/Page3.vue'
import Shortcuts from '../views/Shortcuts.vue'
import NotFound from '../views/NotFound.vue'
import About from '../views/About.vue'
import GachaOverview from '../views/GachaOverview.vue'
import GachaRecords from '../views/GachaRecords.vue'
import GenshinActivities from '@/views/GenshinActivities.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      { 
        path: '', 
        name: 'Home', 
        component: Home,
        meta: { title: 'app.sidebar.home' } 
      },
      { 
        path: 'timeline', 
        name: 'Timeline', 
        component: Page1,
        meta: { title: 'app.sidebar.timeline' } 
      },
      { 
        path: 'notification', 
        name: 'Notification', 
        component: Page2,
        meta: { title: 'app.sidebar.notification' } 
      },
      { 
        path: 'settings', 
        name: 'Settings', 
        component: Page3,
        meta: { title: 'app.sidebar.settings' } 
      },
      { 
        path: 'gacha', 
        name: 'GachaOverview', 
        component: GachaOverview,
        meta: { title: 'app.pages.gacha.overview.title' } 
      },
      { 
        path: 'gacha/records', 
        name: 'GachaRecords', 
        component: GachaRecords,
        meta: { title: 'app.pages.gacha.records.title' } 
      },
      { 
        path: 'shortcuts', 
        name: 'Shortcuts', 
        component: Shortcuts,
        meta: { title: 'app.pages.shortcuts.title' } 
      },
      { 
        path: 'about',
        name: 'About',
        component: About,
        meta: { title: 'app.pages.about.title' }
      },
      { 
        path: 'genshin-activities',
        name: 'GenshinActivities',
        component: GenshinActivities,
        meta: { title: '原神活动数据' }
      },
      { 
        path: '/:pathMatch(.*)*', 
        name: 'NotFound', 
        component: NotFound,
        meta: { title: 'app.pages.notFound.title' } 
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router