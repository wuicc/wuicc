<template>
  <v-app>
    <!-- 顶部应用栏 -->
    <v-app-bar app clipped-left color="primary" dark>
      <!-- 侧边栏开关按钮 -->
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />

      <!-- 应用标题 -->
      <v-toolbar-title>{{ $t("app.title") }}</v-toolbar-title>

      <!-- 语言选择菜单 -->
      <v-menu offset-y transition="slide-y-transition">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            class="text-none"
            style="margin-inline-end: 12px"
          >
            <v-icon left>mdi-translate</v-icon>
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-list density="compact">
          <v-list-item
            v-for="lang in availableLanguages"
            :key="lang.value"
            @click="changeLanguage(lang.value)"
            class="pl-2"
          >
            <v-list-item-title
              :class="{ 'text-accent': locale === lang.value }"
              style="line-height: 32px"
            >
              {{ lang.name }}
              <v-chip
                small
                :color="locale === lang.value ? 'accent' : ''"
                :variant="locale === lang.value ? 'tonal' : 'outlined'"
                class="ml-2 float-right"
              >
                {{ lang.value }}
              </v-chip>
              <!-- ({{lang.value}}) -->
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- 侧边导航栏 -->
    <v-navigation-drawer
      v-model="drawer"
      app
      :temporary="isMobile"
      :permanent="!isMobile"
      :rail="rail"
      @click="rail = false"
    >
      <!-- 侧边栏顶部区域 -->
      <div class="d-flex flex-column" style="height: 100%">
        <!-- 侧边栏标题 -->
        <v-divider />

        <!-- 导航菜单 -->
        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-home"
            :title="$t('app.sidebar.home')"
            value="home"
            to="/"
            exact
            active-class="text-primary_dark"
          />

          <v-list-item
            prepend-icon="mdi-calendar-text"
            :title="$t('app.sidebar.timeline')"
            value="timeline"
            to="/timeline"
            active-class="text-primary_dark"
          />

          <!-- <v-list-item
            prepend-icon="mdi-bell"
            :title="$t('app.sidebar.notification')"
            value="notification"
            to="/notification"
            active-class="text-primary_dark"
          /> -->

          <v-list-item
            prepend-icon="mdi-cog"
            :title="$t('app.sidebar.settings')"
            value="settings"
            to="/settings"
            active-class="text-primary_dark"
          />
          <v-divider style="margin: 8px 0" />
          <v-list-item
            prepend-icon="mdi-link"
            :title="$t('app.pages.shortcuts.title')"
            value="shortcuts"
            to="/shortcuts"
            active-class="text-primary_dark"
          />
          <v-list-item
            prepend-icon="mdi-information"
            :title="$t('app.pages.about.title')"
            value="about"
            to="/about"
            active-class="text-primary_dark"
          />
        </v-list>

        <v-spacer />

        <!-- 侧边栏底部区域 -->
        <div class="pa-2 text-center">
          <v-btn
            variant="text"
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            @click.stop="rail = !rail"
            size="small"
          />
        </div>
      </div>
    </v-navigation-drawer>

    <!-- 主内容区域 -->
    <v-main>
      <v-container fluid class="fill-height pa-4">
        <v-row no-gutters class="fill-height main-container">
          <!-- 内容区域 -->
          <v-col class="fill-height">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </v-col>
        </v-row>
      </v-container>

      <!-- 背景图片 -->
      <div class="background-image-container">
        <v-img
          src="/rb-bg.webp"
          alt="Background"
          contain
          class="background-image"
        />
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useDisplay } from "vuetify";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { updateDocumentTitle } from "../i18n";

const { t, locale } = useI18n();
const { mobile } = useDisplay();
const router = useRouter();

// 响应式数据
const drawer = ref(true);
const rail = ref(false);
const isMobile = mobile;

// ✅ 初始化时根据是否为移动端收起侧边栏
if (isMobile.value) {
  drawer.value = false;
}

// 可用语言列表
const availableLanguages = [
  { value: "en", name: "English", icon: "mdi-language-en" },
  { value: "zh-Hans", name: "简体中文", icon: "mdi-language-zh" },
  { value: "zh-Hant", name: "繁體中文", icon: "mdi-language-zh" },
  { value: "ja", name: "日本語", icon: "mdi-language-jp" },
  { value: "ko", name: "한국어", icon: "mdi-language-ko" },
  { value: "fr", name: "Français", icon: "mdi-language-fr" },
  { value: "es", name: "Español", icon: "mdi-language-es" },
  { value: "de", name: "Deutsch", icon: "mdi-language-de" },
];

// 计算当前语言名称
const currentLanguageName = computed(() => {
  const lang = availableLanguages.find((l) => l.value === locale.value);
  return lang ? `${lang.name} (${lang})` : "English";
});

// 切换语言
const changeLanguage = (lang) => {
  locale.value = lang;
  localStorage.setItem("userLanguage", lang);

  // 更新HTML lang属性
  document.documentElement.lang = lang;

  // 如果当前在移动端且侧边栏打开，切换语言后自动关闭
  if (isMobile.value && drawer.value) {
    drawer.value = false;
  }
  updateDocumentTitle(); // 切换语言时更新标题
};

// 监听语言变化
watch(locale, () => {
  updateDocumentTitle();
});

// 监听路由变化，在移动端自动关闭侧边栏
router.afterEach(() => {
  if (isMobile.value) {
    drawer.value = false;
  }
});

// 初始化时设置HTML lang属性
document.documentElement.lang = locale.value;

import { onMounted } from "vue";
import { useTheme } from "vuetify";

const theme = useTheme();

onMounted(() => {
  const savedTheme = localStorage.getItem("theme") || "system";
  if (savedTheme === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    theme.global.name.value = isDark ? "dark" : "light";
  } else {
    theme.global.name.value = savedTheme;
  }
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
</style>


<style scoped>
.main-container {
  /* position: absolute; */
  z-index: 5;
  width: 100%;
}
/* 路由切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
  /* z-index: -1; */
  pointer-events: none;
}

.background-image {
  width: 100%;
  max-width: 500px;
  margin-left: auto;
  opacity: 0.6;
}

/* 横屏布局 */
/* @media (orientation: landscape) {
  .background-image-container {
    width: auto;
    height: 50vh;
  }
  .background-image {
    height: 100%;
    max-width: none;
    margin-left: auto;
    margin-right: 0;
  }
}

/* 竖屏布局 
@media (orientation: portrait) {
  .background-image-container {
    display: flex;
    justify-content: center;
  }
  .background-image {
    max-width: 100%;
  }
} */
</style>