<template>
  <v-app>
    <!-- 顶部应用栏 -->
    <v-app-bar app clipped-left color="primary" dark :class="{
      'window-controls-overlay-visible': windowControlsOverlayVisible,
    }">
      <div class="draggable-region" :style="{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        '-webkit-app-region': windowControlsOverlayVisible
          ? 'drag'
          : 'no-drag',
      }"></div>
      <!-- 侧边栏开关按钮 -->
      <v-app-bar-nav-icon class="ml-1" @click.stop="drawer = !drawer" style="-webkit-app-region: no-drag" />

      <!-- 应用标题 -->
      <v-toolbar-title style="-webkit-app-region: no-drag">{{
        $t("app.title")
        }}</v-toolbar-title>
      <v-btn v-if="showInstallButton" variant="text" @click="installPWA" class="mr-2"
        icon="mdi-monitor-arrow-down-variant" style="-webkit-app-region: no-drag">
      </v-btn>
      <!-- 语言选择菜单 -->
      <v-menu offset-y transition="slide-y-transition">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" variant="text" class="text-none language-menu-btn"
            style="margin-inline-end: 12px; -webkit-app-region: no-drag">
            <v-icon left>mdi-translate</v-icon>
            &nbsp;{{ currentLanguageName }}&nbsp;
            <v-icon right>{{
              props["aria-expanded"] === "true"
                ? "mdi-chevron-up"
                : "mdi-chevron-down"
            }}</v-icon>
          </v-btn>
        </template>

        <v-list density="compact">
          <v-list-item v-for="lang in availableLanguages" :key="lang.value" @click="changeLanguage(lang.value)"
            class="pl-2">
            <v-list-item-title :class="{ 'text-accent': locale === lang.value }" style="line-height: 32px"
              :lang="lang.value">
              {{ lang.name }}
              <v-chip small :color="locale === lang.value ? 'accent' : ''"
                :variant="locale === lang.value ? 'tonal' : 'outlined'" class="ml-2 float-right">
                {{ lang.value }}
              </v-chip>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- 侧边导航栏 -->
    <v-navigation-drawer v-model="drawer" app :temporary="isMobile" :permanent="!isMobile" :rail="!isMobile && rail">
      <!-- 侧边栏顶部区域 -->
      <div class="d-flex flex-column" style="height: 100%">
        <!-- 侧边栏标题 -->
        <v-divider />

        <!-- 导航菜单 -->
        <v-list density="compact" nav>
          <v-list-item prepend-icon="mdi-home" :title="$t('app.sidebar.home')" value="home" to="/" exact
            :active="activeRoutePath === '/'" active-class="text-primary_dark" />
          <v-list-item prepend-icon="mdi-crystal-ball" :title="$t('app.sidebar.gacha')" value="gacha" to="/gacha"
            :active="activeRoutePath === '/gacha'" active-class="text-primary_dark" />
          <v-list-item prepend-icon="mdi-calendar-text" :title="$t('app.sidebar.timeline')" value="timeline"
            to="/timeline" :active="activeRoutePath === '/timeline'" active-class="text-primary_dark" />
          <v-list-item prepend-icon="mdi-cog" :title="$t('app.sidebar.settings')" value="settings" to="/settings"
            :active="activeRoutePath === '/settings'" active-class="text-primary_dark" />
          <v-divider style="margin: 8px 0" />
          <v-list-item prepend-icon="mdi-link" :title="$t('app.pages.shortcuts.title')" value="shortcuts"
            to="/shortcuts" :active="activeRoutePath === '/shortcuts'" active-class="text-primary_dark" />
          <v-list-item prepend-icon="mdi-star-circle" :title="$t('app.sidebar.genshinActivities')" value="genshin-activities"
            to="/genshin-activities" :active="activeRoutePath === '/genshin-activities'"
            active-class="text-primary_dark" />
          <v-list-item prepend-icon="mdi-information" :title="$t('app.pages.about.title')" value="about" to="/about"
            :active="activeRoutePath === '/about'" active-class="text-primary_dark" />
        </v-list>

        <v-spacer />

        <!-- 侧边栏底部区域 - 只在非移动端显示 -->
        <div v-if="!isMobile" class="pa-2 text-center">
          <v-btn variant="text" :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'" @click.stop="toggleRail"
            size="small" />
        </div>
      </div>
    </v-navigation-drawer>

    <!-- 主内容区域 -->
    <v-main>
      <v-container fluid class="fill-height pa-4">
        <v-row no-gutters class="fill-height main-container">
          <!-- 内容区域 -->
          <v-col class="fill-height">
            <router-view v-slot="{ Component, route }">
              <!-- 为滑动动画创建一个容器，保持原布局结构 -->
              <div class="transition-container">
                <transition :name="transitionName" :mode="transitionMode">
                  <keep-alive :include="['Timeline']">
                    <component :is="Component" :key="route.path" />
                  </keep-alive>
                </transition>
              </div>
            </router-view>
          </v-col>
        </v-row>
      </v-container>

      <!-- 背景图片 -->
      <div v-if="showBackgroundImage" class="background-image-container">
        <v-img src="/assets/images/rb-bg.webp" alt="Background" contain class="background-image" />
      </div>
    </v-main>

    <!-- 全局Toast组件 -->
    <AppToast ref="toast" @mounted="handleToastMounted" />
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, provide } from "vue";
import { useDisplay } from "vuetify";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { updateDocumentTitle, loadLanguage } from "../i18n";
import StorageManager from "@/utils/StorageManager";
import { i18n } from "@/i18n";
import { useTheme } from "vuetify";
import AppToast from "@/components/AppToast.vue";
import { useAuthStore } from '@/store/auth';
import { fetchUserProfile } from '@/store/auth';

const { t, locale } = useI18n();
const { mobile } = useDisplay();
const router = useRouter();
const route = useRoute();
const theme = useTheme();
const authStore = useAuthStore();

// Toast 相关
const toast = ref(null);
const isToastReady = ref(false);

/**
 * 加载用户信息
 */
const loadUserInfo = async () => {
  try {
    // 检查是否有认证令牌
    const token = StorageManager.get('auth_token');
    if (!token) {
      return;
    }

    // 尝试获取用户信息
    authStore.setLoading(true);
    // fetchUserProfile内部会调用authStore.fetchUserProfileFromAPI
    // 该方法会在登录失败时显示Toast提示
    await fetchUserProfile(toast.value, t);
  } catch (error) {
    console.error('加载用户信息失败:', error);
  } finally {
    authStore.setLoading(false);
  }
};

// 提供全局的toast实例
provide('toast', toast);
provide('isToastReady', isToastReady);

const handleToastMounted = () => {
  isToastReady.value = true;
};

const navigationKey = ref(0);

// 延迟更新的激活路由路径
const activeRoutePath = ref(route.path);
// 记录上一个路由路径，用于判断过渡方向
const prevRoutePath = ref('');

// 检查是否是GachaOverview和GachaRecords之间的切换
const isGachaPagesTransition = computed(() => {
  const isGachaOverviewToRecords = prevRoutePath.value === '/gacha' && route.path === '/gacha/records';
  const isRecordsToGachaOverview = prevRoutePath.value === '/gacha/records' && route.path === '/gacha';
  return isGachaOverviewToRecords || isRecordsToGachaOverview;
});

// 动态计算过渡动画名称
const transitionName = computed(() => {
  if (prevRoutePath.value === '/gacha' && route.path === '/gacha/records') {
    // 从overview到records：左移动
    return 'slide-left';
  } else if (prevRoutePath.value === '/gacha/records' && route.path === '/gacha') {
    // 从records到overview：右移动
    return 'slide-right';
  }

  // 其他情况保持默认的fade过渡
  return 'fade';
});

// 动态计算过渡模式
const transitionMode = computed(() => {
  // 只有两个页面之间的切换使用overlap模式
  return isGachaPagesTransition.value ? '' : 'out-in';
});

// 延迟更新侧边栏高亮状态的函数
const updateActiveRouteWithDelay = (path) => {
  // 清除之前的定时器，避免多次触发
  clearTimeout(window.routeHighlightTimer);

  // 设置200ms的延迟，等待页面过渡动画完成
  window.routeHighlightTimer = setTimeout(() => {
    activeRoutePath.value = path;
  }, 200);
};

// 监听路由变化，延迟更新高亮状态并记录上一个路由
watch(() => route.path, (newPath, oldPath) => {
  // 在路由变化前保存旧路径
  prevRoutePath.value = oldPath;
  navigationKey.value++; // 路由变化时强制重新渲染侧边栏
  updateActiveRouteWithDelay(newPath); // 延迟更新高亮状态
});

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  clearTimeout(window.routeHighlightTimer);
});

// 响应式数据
const drawer = ref(null);
const rail = ref(false); // 默认展开(false)
const isMobile = mobile;
const windowControlsOverlayVisible = ref(false);
const showBackgroundImage = ref(
  StorageManager.get("showBackgroundImage") !== "false"
);

// 监听StorageManager变化以更新背景图片显示状态
const handleStorageChange = () => {
  showBackgroundImage.value = StorageManager.get("showBackgroundImage") !== "false";
};

// 监听StorageManager的自定义事件
StorageManager.onStorageChange(({ key }) => {
  if (key === "showBackgroundImage") {
    handleStorageChange();
  }
});

// 初始化时根据是否为移动端设置侧边栏状态
if (isMobile.value) {
  drawer.value = false; // 移动端默认关闭
} else {
  drawer.value = true; // 桌面端默认显示
  rail.value = StorageManager.get("sidebarRailState") ?? false; // 从存储中读取rail状态
}

// 切换rail状态并保存
const toggleRail = () => {
  rail.value = !rail.value;
  StorageManager.set("sidebarRailState", rail.value);
};

// 检查窗口控制覆盖层状态
const checkWindowControlsOverlay = () => {
  if ("windowControlsOverlay" in navigator) {
    windowControlsOverlayVisible.value =
      navigator.windowControlsOverlay.visible;

    // Set initial CSS variable
    document.documentElement.style.setProperty(
      "--titlebar-width",
      `${navigator.windowControlsOverlay.getTitlebarAreaRect().width}px`
    );

    // Add event listener for geometry changes
    navigator.windowControlsOverlay.addEventListener(
      "geometrychange",
      (event) => {
        windowControlsOverlayVisible.value = event.visible;
        document.documentElement.style.setProperty(
          "--titlebar-width",
          `${event.titlebarAreaRect.width}px`
        );
      }
    );
  }
};

// 可用语言列表
const availableLanguages = [
  { value: "en", name: "English", icon: "mdi-language-en" },
  { value: "zh-Hans", name: "简体中文", icon: "mdi-language-zh" },
  { value: "zh-Hant", name: "繁體中文", icon: "mdi-language-zh" },
  { value: "ja", name: "日本語", icon: "mdi-language-jp" },
  { value: "ko", name: "한국어", icon: "mdi-language-ko" },
  { value: "fr", name: "Français", icon: "mdi-language-fr" },
];

// 计算当前语言名称
const currentLanguageName = computed(() => {
  const lang = availableLanguages.find((l) => l.value === locale.value);
  return lang ? `${lang.name}` : "English";
});

// 切换语言
const changeLanguage = async (lang) => {
  // 显示加载状态（可选，可以添加一个加载指示器）

  try {
    // 预先加载语言文件
    if (lang !== 'en') {
      await loadLanguage(lang);
    }

    // 切换语言
    locale.value = lang;
    StorageManager.set("userLanguage", lang);

    // 更新HTML lang属性
    document.documentElement.lang = lang;

    // 如果当前在移动端且侧边栏打开，切换语言后自动关闭
    if (isMobile.value && drawer.value) {
      drawer.value = false;
    }
    updateDocumentTitle(); // 切换语言时更新标题
  } catch (error) {
    console.error(`Failed to change language to ${lang}:`, error);
    // 可以在这里显示错误提示
  }
};

// 监听语言变化
watch(locale, () => {
  // 传递当前路由的 meta.title 作为子标题
  updateDocumentTitle(route.meta?.title ? t(route.meta.title) : "");
});

// 监听路由变化
watch(
  () => router.currentRoute.value,
  (to) => {
    updateDocumentTitle(to.meta?.title ? i18n.global.t(to.meta.title) : "");
  },
  { immediate: true }
);

watch(isMobile, () => {
  if (isMobile.value) {
    drawer.value = false;
  } else {
    rail.value = StorageManager.get("sidebarRailState") ?? false;
  }
});

// 初始化时设置HTML lang属性
document.documentElement.lang = locale.value;

// 添加PWA安装相关代码
const deferredPrompt = ref(null);
const showInstallButton = ref(false);

const handleBeforeInstallPrompt = (e) => {
  deferredPrompt.value = e;
  showInstallButton.value = true;
};

const handleAppInstalled = () => {
  showInstallButton.value = false;
  deferredPrompt.value = null;
};

const installPWA = () => {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt();
    deferredPrompt.value.userChoice.then((choiceResult) => {
      deferredPrompt.value = null;
      showInstallButton.value = false;
    });
  }
};

onMounted(() => {
  checkWindowControlsOverlay();
  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);
  const savedTheme = StorageManager.get("theme") || "system";
  if (savedTheme === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    theme.global.name.value = isDark ? "dark" : "light";
  } else {
    theme.global.name.value = savedTheme;
  }
  // 加载用户信息
  loadUserInfo();
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.removeEventListener("appinstalled", handleAppInstalled);
});
</script>

<style>
::selection {
  background-color: #0094e8;
  color: #fff;
}

::-moz-selection {
  background-color: #0094e8;
  color: #fff;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #fff8;
}

::-webkit-scrollbar-thumb {
  background: #0006;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #000a;
}

/* 窗口控制覆盖层可见时的样式 */
.v-app-bar.window-controls-overlay-visible .language-menu-btn {
  right: calc(100vw - var(--titlebar-width));
}
</style>

<style scoped>
.main-container {
  z-index: 5;
  width: 100%;
}

/* 路由切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滑动动画容器 - 保持页面布局稳定性 */
.transition-container {
  position: relative;
  min-height: 1px;
  /* 确保容器有高度 */
  width: 100%;
}

/* 滑动动画通用样式 - 优化动画性能 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

/* 滑动动画特定样式 - 添加淡出效果 */
.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 只在滑动动画期间应用绝对定位，保持布局一致性 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  /* 默认层级 */
}

/* 确保进入的元素在上方 */
.slide-left-enter-active,
.slide-right-enter-active {
  z-index: 1;
}

/* 确保退出的元素在下方 */
.slide-left-leave-active,
.slide-right-leave-active {
  z-index: 0;
}

/* 侧边栏滚动条样式 */
.v-navigation-drawer__content::-webkit-scrollbar {
  width: 4px;
}

.v-navigation-drawer__content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

/* 移动端侧边栏样式 */
@media (max-width: 960px) {
  .v-navigation-drawer {
    width: 280px;
  }
}

/* 背景图片样式 */
.background-image-container {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 100%;
  height: auto;
  pointer-events: none;
}

.background-image {
  width: 100%;
  max-width: 500px;
  margin-left: auto;
  opacity: 0.6;
}
</style>