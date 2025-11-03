<template>
  <div v-if="showWelcome">
    <v-dialog v-model="dialog" persistent max-width="800" scrollable>
      <v-card>
        <v-card-title class="text-h5">
          {{ $t("app.welcome.title") }}
          <v-btn
            class="float-right"
            color="accent"
            variant="elevated"
            @click="handleComplete"
            prepend-icon="mdi-check"
          >
            {{ $t("app.welcome.confirm") }}
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <GameSelector :show-info="true" />
        </v-card-text>
        <v-card-text
          v-if="showBeian"
          class="jump-tip text-center pt-0 pb-4"
          v-html="beianText"
        >
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>

  <div class="home-root" v-else>
    <!-- Hero Section with Carousel -->
    <v-card class="ma-2 hero-card">
      <div class="d-flex justify-center py-6">
        <v-avatar size="120" color="#fff" class="elevation-3 logo-avatar">
          <v-img src="/assets/images/logo-black.svg" alt="App Logo" contain />
        </v-avatar>
      </div>

      <v-card-title class="text-center">
        {{ $t("app.title") }}
      </v-card-title>
      <v-card-text class="text-center">
        {{ $t("app.pages.home.intro") }}
      </v-card-text>

      <div
        v-if="showJumpTip && jumpTip"
        class="jump-tip text-center mt-4"
        v-html="jumpTip"
      ></div>

      <v-card-actions class="justify-center pb-6 flex-column">
        <div class="d-flex flex-wrap justify-center align-center gap-4 mb-1">
          <v-btn
            color="accent"
            size="large"
            variant="elevated"
            :to="{ path: '/gacha' }"
            class="my-1 flex-grow-0 action-btn"
          >
            {{ $t("app.common.go_to", { target: $t("app.pages.gacha.title") }) }}
          </v-btn>
          <v-btn
            color="accent"
            size="large"
            variant="elevated"
            :to="{ path: '/timeline' }"
            class="my-1 flex-grow-0 action-btn"
          >
            {{ $t("app.common.go_to", { target: $t("app.pages.timeline.title") }) }}
          </v-btn>
          <v-btn
            v-if="showBeian && !hasAuthToken"
            color="accent"
            size="large"
            variant="elevated"
            :to="{ path: '/settings', query: { highlight: 'login' } }"
            class="my-1 flex-grow-0 action-btn d-flex align-center"
          >
            {{ $t("app.pages.home.go_to_login")
            }}<span class="d-none d-sm-inline">
              - {{ $t("app.pages.home.login_support") }}</span
            >
            <img
              src="/assets/images/qq-login-full.png"
              class="qq-login-img ml-1"
              :alt="$t('app.pages.home.qq_login')"
            />
          </v-btn>
        </div>
      </v-card-actions>

      <v-card-text class="carousel-container">
        <v-carousel
          v-model="currentSlide"
          cycle
          hide-delimiters
          :interval="5000"
          show-arrows="hover"
        >
          <v-carousel-item
            v-for="(feature, index) in features"
            :key="index"
            class="carousel-item"
          >
            <div class="carousel-content">
              <v-icon size="64" color="accent">{{ feature.icon }}</v-icon>
              <h3 class="text-h5 my-4">{{ $t(feature.title) }}</h3>
              <p class="text-body-1">{{ $t(feature.description) }}</p>
            </div>
          </v-carousel-item>
        </v-carousel>
      </v-card-text>
    </v-card>

    <!-- Beian Info Card -->
    <v-card v-if="showBeian" class="position-fixed ml-2 beian-card">
      <v-card-text class="jump-tip text-center" v-html="beianText">
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import GameSelector from "@/components/GameSelector.vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import StorageManager from "@/utils/StorageManager";

const { mdAndUp } = useDisplay();
const isWideScreen = mdAndUp.value;

const { t, locale } = useI18n();
const dialog = ref(false);
const showWelcome = ref(false);
const currentSlide = ref(0);

// Feature carousel data - now using i18n keys
const features = ref([
  {
    icon: "mdi-calendar-star-four-points",
    title: "app.pages.home.features.multi_game.title",
    description: "app.pages.home.features.multi_game.description",
  },
  {
    icon: "mdi-bell-alert",
    title: "app.pages.home.features.reminders.title",
    description: "app.pages.home.features.reminders.description",
  },
  {
    icon: "mdi-map-search-outline",
    title: "app.pages.home.features.timezones.title",
    description: "app.pages.home.features.timezones.description",
  },
  {
    icon: "mdi-palette",
    title: "app.pages.home.features.interface.title",
    description: "app.pages.home.features.interface.description",
  },
]);

// Get all configurations from environment variables
const jumpTip = import.meta.env.VITE_JUMP_TIP;
const beianText = import.meta.env.VITE_BEIAN_TEXT;
const DOMESTIC_DOMAIN = import.meta.env.VITE_DOMESTIC_DOMAIN;
const INTERNATIONAL_DOMAIN = import.meta.env.VITE_INTERNATIONAL_DOMAIN;

// Computed properties
const hasAuthToken = computed(() => {
  return !!StorageManager.get("auth_token");
});

const showBeian = computed(() => {
  return window.location.hostname === DOMESTIC_DOMAIN;
});

const showJumpTip = computed(() => {
  return (
    locale.value === "zh-Hans" &&
    window.location.hostname === INTERNATIONAL_DOMAIN
  );
});

// Methods
const handleComplete = () => {
  // 保存用户已完成选择的标志
  StorageManager.set("hasCompletedGameSelection", true);
  showWelcome.value = false;
  dialog.value = false;
};

// Lifecycle hooks
onMounted(() => {
  // 检查用户是否已完成过游戏选择
  // const hasCompletedSelection = StorageManager.get("hasCompletedGameSelection");
  // const userGameSelections = StorageManager.get("userGameSelections");

  // // 如果用户没有完成过选择且没有游戏选择记录，则显示欢迎对话框
  // if (!hasCompletedSelection && !userGameSelections) {
  //   showWelcome.value = true;
  //   dialog.value = true;
  // }
});
</script>

<style>
.jump-tip a {
  color: #00b0ff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.jump-tip a:hover {
  color: #33beff;
}
</style>

<style scoped>
.home-root {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-card {
  background-color: #fffa;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.v-theme--dark .hero-card {
  background-color: #444a;
}

.logo-avatar {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.logo-avatar:hover {
  transform: scale(1.05) rotate(5deg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.carousel-container {
  padding: 0 24px;
}

.carousel-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px 2%;
  text-align: center;
  min-height: 200px;
}

.carousel-item {
  padding-bottom: 24px;
}

.beian-card {
  bottom: 12px;
  right: 12px;
  border-radius: 8px;
  opacity: 0.9;
}

.gap-4 {
  gap: 16px;
}

.qq-login-img {
  max-height: 20px;
  max-width: 70px;
}

.flex-grow-0 {
  flex-grow: 0 !important;
  flex-shrink: 0 !important;
}

.action-btn {
  transition: all 0.3s ease;
  min-width: 220px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Custom carousel styling */
:deep(.v-carousel__controls) {
  background: transparent;
}

:deep(.v-carousel__controls .v-btn) {
  color: rgba(var(--v-theme-accent), 0.8);
}

:deep(.v-carousel__controls .v-btn--active) {
  color: rgb(var(--v-theme-accent));
}

:deep(.v-carousel__controls .v-btn:hover) {
  color: rgb(var(--v-theme-accent));
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .carousel-content {
    padding: 16px 5%;
  }

  .carousel-container {
    padding: 0 12px;
  }

  .action-btn {
    min-width: 180px;
  }
}

:deep(.v-carousel) {
  height: auto !important;
}
</style>