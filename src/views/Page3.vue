<template>
  <v-card class="setting-root">
    <v-card-title class="my-2">
      {{ $t("app.settings.title") }}
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="7" class="pt-2 pb-0">
          <v-expansion-panels class="mb-2" v-model="panel" multiple>
            <v-expansion-panel eager value="games">
              <v-expansion-panel-title>
                <template v-slot:default="{ expanded }">
                  <div class="d-flex align-center w-100">
                    <v-icon class="mr-2">mdi-controller</v-icon>
                    <span class="text-h6">{{
                      $t("app.settings.gameSelection.title")
                    }}</span>

                    <v-spacer></v-spacer>

                    <v-btn v-if="expanded" icon variant="text" size="small" @click.stop="forceRefreshGames"
                      :loading="loading" :disabled="loading">
                      <v-icon>mdi-refresh</v-icon>
                      <template v-slot:loader>
                        <v-progress-circular indeterminate size="24"></v-progress-circular>
                      </template>
                    </v-btn>
                  </div>
                </template>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <GameSelector ref="gameSelector" :show-info="false" />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col cols="12" md="5" class="pt-2">
          <!-- 使用新的登录面板组件 -->
          <LoginPanel v-if="isToastReady" class="mb-2" :toast="toast" v-model:profileLoading="profileLoading"
            v-model:uploadingSettings="uploadingSettings" v-model:downloadingSettings="downloadingSettings"
            v-model:clearingLocal="clearingLocal" v-model:clearingCloud="clearingCloud"
            v-model:loggingOutAll="loggingOutAll" :jumpTip="jumpTip" :isLoaded="isLoaded"
            @uploadSettings="uploadSettings" @downloadSettings="downloadSettings"
            @clearLocalSettings="clearLocalSettings" @clearCloudSettings="clearCloudSettings" @logout="logout"
            @logoutAllSessions="logoutAllSessions" ref="loginPanelRef" />

          <!-- Timezone settings -->
          <v-card id="timezone-settings" class="mb-4" :class="{ 'highlight-card': isHighlighting }">
            <v-card-title class="text-h6">
              <v-icon left>mdi-clock-time-three</v-icon>
              {{ $t("app.settings.timezone.title") }}
            </v-card-title>
            <v-card-text>
              <v-select v-model="selectedServerTimezone" :items="timezoneOptions"
                :label="$t('app.settings.timezone.serverLabel')" item-title="text" item-value="value"
                density="comfortable" hide-details="auto" class="mb-2" color="accent"></v-select>

              <v-checkbox-btn v-model="useLocalTimezone" :label="$t('app.settings.timezone.useLocalLabel')"
                color="accent"></v-checkbox-btn>

              <v-checkbox-btn v-model="use24HourFormat" :label="use24HourFormat
                ? $t('app.timeFormat.24hour')
                : $t('app.timeFormat.12hour')
                " color="accent"></v-checkbox-btn>
            </v-card-text>
          </v-card>

          <!-- Theme settings -->
          <v-card class="mb-4">
            <v-card-title class="text-h6">
              <v-icon left>mdi-palette</v-icon>
              {{ $t("app.settings.theme.title") }}
            </v-card-title>
            <v-card-text>
              <v-select :items="themeOptions" :label="$t('app.settings.theme.selectLabel')" density="comfortable"
                v-model="selectedTheme" @update:modelValue="changeTheme" hide-details="auto" color="accent"></v-select>
              <v-checkbox-btn v-model="showBackgroundImage" :label="$t('app.settings.theme.showBackgroundImage')"
                color="accent" class="mt-3"></v-checkbox-btn>
            </v-card-text>
          </v-card>

          <!-- Debug settings -->
          <v-card class="mb-4">
            <v-card-title class="text-h6">
              <v-icon left>mdi-bug</v-icon>
              {{ $t("app.settings.debug.title") }}
            </v-card-title>
            <v-card-text>
              <v-btn color="error" variant="outlined" @click="resetLanguageCache" :loading="resettingLanguageCache"
                :disabled="resettingLanguageCache">
                <v-icon left>mdi-close-box</v-icon>
                {{ $t("app.settings.debug.resetLanguageCache") }}
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick, inject } from "vue";
import { i18n } from "@/i18n";
import GameSelector from "@/components/GameSelector.vue";
import axios from "axios";
import { useTheme } from "vuetify";
import { useDisplay } from "vuetify";
import StorageManager from "@/utils/StorageManager";
import LoginPanel from "@/components/LoginPanel.vue";
import LanguageStorageManager from "@/utils/LanguageStorageManager";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { getApiUrl } from "@/utils/apiEndpoints";

const route = useRoute();
const isHighlighting = ref(false);

// 基础状态和引用
const loading = ref(false);
const gameSelector = ref(null);
const panel = ref(["games"]);
const theme = useTheme();
const { mobile, mdAndUp } = useDisplay();
const resettingLanguageCache = ref(false);

// 从父组件注入toast实例
const toast = inject('toast');
const isToastReady = inject('isToastReady');

// 初始化auth store
const authStore = useAuthStore();

// 用户信息不再需要本地维护，LoginPanel组件现在直接从auth store读取用户信息

const loginPanelRef = ref(null);

// 计算属性
const isLoaded = ref(false);
const jumpTip = import.meta.env.VITE_JUMP_TIP;

const themeOptions = computed(() => [
  { title: i18n.global.t("app.settings.theme.system"), value: "system" },
  { title: i18n.global.t("app.settings.theme.light"), value: "light" },
  { title: i18n.global.t("app.settings.theme.dark"), value: "dark" },
]);

const use24HourFormat = ref(
  StorageManager.get("timeline-time-format") !== "12"
);
const selectedTheme = ref(StorageManager.get("theme") || "system");
const selectedServerTimezone = ref("UTC+8");
const useLocalTimezone = ref(false);
const showBackgroundImage = ref(
  StorageManager.get("showBackgroundImage") !== "false"
);

const timezoneOptions = computed(() => [
  {
    text: i18n.global.t("app.settings.timezone.options.asia"),
    value: "UTC+8",
  },
  {
    text: i18n.global.t("app.settings.timezone.options.america"),
    value: "UTC-5",
  },
  {
    text: i18n.global.t("app.settings.timezone.options.europe"),
    value: "UTC+1",
  },
]);

// 云同步相关状态
const uploadingSettings = ref(false);
const downloadingSettings = ref(false);
const clearingLocal = ref(false);
const clearingCloud = ref(false);
const loggingOutAll = ref(false);

watch(
  mdAndUp,
  (newValue) => {
    // 当屏幕宽度≥md(960px)时自动展开，否则自动收起
    panel.value = newValue ? ["games"] : [];
  },
  { immediate: true }
);

// 监听时间相关设置变化并保存
watch(selectedServerTimezone, (newVal) => {
  StorageManager.set("serverTimezone", newVal);
});

watch(useLocalTimezone, (newVal) => {
  StorageManager.set("useLocalTimezone", newVal.toString());
});

watch(use24HourFormat, (newVal) => {
  StorageManager.set("timeline-time-format", newVal ? "24" : "12");
});

// 监听背景图片设置变化并保存
watch(showBackgroundImage, (newVal) => {
  StorageManager.set("showBackgroundImage", newVal.toString());
});

// 系统主题检测
const systemDarkMode = window.matchMedia("(prefers-color-scheme: dark)");

const changeTheme = (themeName) => {
  selectedTheme.value = themeName;
  StorageManager.set("theme", themeName);

  if (themeName === "system") {
    applySystemTheme();
  } else {
    theme.global.name.value = themeName;
  }
};

const applySystemTheme = () => {
  const isSystemDark = systemDarkMode.matches;
  theme.global.name.value = isSystemDark ? "dark" : "light";
};

// 游戏相关方法
const forceRefreshGames = async () => {
  loading.value = true;
  try {
    await gameSelector.value?.refresh(true);
    const gameList = StorageManager.get("gameList") || [];
    gameSelector.value?.clean(gameList);
    toast.value.showToast(
      i18n.global.t("app.settings.gameSelection.refreshSuccess"),
      "success"
    );
  } catch (error) {
    console.error("Failed to refresh games:", error);
    toast.value.showToast(
      i18n.global.t("app.settings.gameSelection.refreshFailed"),
      "error"
    );
  } finally {
    loading.value = false;
  }
};

const handleSave = () => {
  toast.value.showToast(
    i18n.global.t("app.settings.gameSelection.saved"),
    "success"
  );
};

// 认证相关方法
const logout = async () => {
  try {
    const token = StorageManager.get("auth_token");
    if (!token) return;

    await axios.post(
      "/api/auth/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    StorageManager.remove("auth_token");
    StorageManager.remove("user_id");
    // 用户数据现在通过auth store管理，不需要在这里清除

    toast.value.showToast(
      i18n.global.t("app.settings.account.logoutSuccess"),
      "success"
    );
  } catch (error) {
    console.error("Logout error:", error);
    toast.value.showToast(
      i18n.global.t("app.settings.account.logoutFailed"),
      "error"
    );
  }
};

const logoutAllSessions = async () => {
  loggingOutAll.value = true;
  try {
    const token = StorageManager.get("auth_token");
    if (!token) return;

    await axios.post(
      "/api/auth/logout_all",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    StorageManager.remove("auth_token");
    StorageManager.remove("user_id");
    user.value = { username: "", nickname: "", id: null };

    toast.value.showToast(
      i18n.global.t("app.settings.account.logoutAllSuccess"),
      "success"
    );
  } catch (error) {
    console.error("Logout all error:", error);
    toast.value.showToast(
      i18n.global.t("app.settings.account.logoutAllFailed"),
      "error"
    );
  } finally {
    loggingOutAll.value = false;
  }
};

// 云同步方法
const uploadSettings = async () => {
  uploadingSettings.value = true;
  try {
    const activityStatus = StorageManager.get("activityStatus");
    const userGameSelections = StorageManager.get("userGameSelections");

    if (!activityStatus || !userGameSelections) {
      throw new Error(i18n.global.t("app.settings.account.noLocalSettings"));
    }

    const response = await axios.post(
      "/api/user/upload_settings",
      {
        activityStatus,
        userGameSelections,
      },
      {
        headers: {
          Authorization: `Bearer ${StorageManager.get("auth_token")}`,
        },
      }
    );

    if (response.data.code === 200) {
      toast.value.showToast(
        i18n.global.t("app.settings.account.uploadSuccess"),
        "success"
      );
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error("Upload settings error:", error);
    toast.value.showToast(
      error.message || i18n.global.t("app.settings.account.uploadFailed"),
      "error"
    );
  } finally {
    uploadingSettings.value = false;
  }
};

const downloadSettings = async () => {
  downloadingSettings.value = true;
  try {
    const response = await axios.get("/api/user/download_settings", {
      headers: {
        Authorization: `Bearer ${StorageManager.get("auth_token")}`,
      },
    });

    if (response.data.code === 200) {
      const { activityStatus, userGameSelections } = response.data.data;
      StorageManager.set("activityStatus", activityStatus);
      StorageManager.set("userGameSelections", userGameSelections);
      toast.value.showToast(
        i18n.global.t("app.settings.account.downloadSuccess"),
        "success"
      );
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error("Download settings error:", error);
    toast.value.showToast(
      error.message || i18n.global.t("app.settings.account.downloadFailed"),
      "error"
    );
  } finally {
    downloadingSettings.value = false;
  }
};

// 数据清理方法
const clearLocalSettings = async () => {
  clearingLocal.value = true;
  try {
    StorageManager.remove("activityStatus");
    StorageManager.remove("userGameSelections");

    toast.value.showToast(
      i18n.global.t("app.settings.account.clearLocalSuccess"),
      "success"
    );
  } catch (error) {
    console.error("Clear local settings error:", error);
    toast.value.showToast(
      i18n.global.t("app.settings.account.clearLocalFailed"),
      "error"
    );
  } finally {
    clearingLocal.value = false;
  }
};

const clearCloudSettings = async () => {
  clearingCloud.value = true;
  try {
    const response = await axios.post(
      "/api/user/clear_cloud_settings",
      {},
      {
        headers: {
          Authorization: `Bearer ${StorageManager.get("auth_token")}`,
        },
      }
    );

    if (response.data.code === 200) {
      toast.value.showToast(
        i18n.global.t("app.settings.account.clearCloudSuccess"),
        "success"
      );
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error("Clear cloud settings error:", error);
    toast.value.showToast(
      error.message || i18n.global.t("app.settings.account.clearCloudFailed"),
      "error"
    );
  } finally {
    clearingCloud.value = false;
  }
};

// 调试相关方法
const resetLanguageCache = async () => {
  resettingLanguageCache.value = true;
  try {
    // 调用LanguageStorageManager重置语言文件缓存
    LanguageStorageManager.clearLanguageCache();
    toast.value.showToast(
      i18n.global.t("app.settings.debug.languageCacheCleared"),
      "success"
    );
  } catch (error) {
    console.error("Failed to reset language cache:", error);
    toast.value.showToast(
      i18n.global.t("app.settings.debug.languageCacheClearFailed"),
      "error"
    );
  } finally {
    resettingLanguageCache.value = false;
  }
};

// 在 setup 中添加
const profileLoading = ref(false);

// 不再需要fetchUserProfile函数，LoginPanel组件现在直接从auth store读取用户信息

// 统一处理认证错误
const handleAuthError = (errorCode, message) => {
  // 清除无效的token
  StorageManager.remove("auth_token");
  StorageManager.remove("user_id");

  switch (errorCode) {
    case 200003: // INVALID_TOKEN
    case 200017: // TOKEN_EXPIRED
      toast.value.showToast(
        i18n.global.t("app.settings.account.loginFailed"),
        "error"
      );
      break;
    case 200012: // ACCOUNT_BANNED
      toast.value.showToast(
        message || i18n.global.t("app.settings.account.accountBanned"),
        "error"
      );
      break;
    case 200011: // NOT_ACTIVATED
      toast.value.showToast(
        message || i18n.global.t("app.settings.account.accountNotActivated"),
        "error"
      );
      break;
    default:
      toast.value.showToast(
        message || i18n.global.t("app.settings.account.loginFailed"),
        "error"
      );
  }
  // 用户数据现在通过auth store管理，不需要在这里清除
};

const highlightTimezoneSetting = () => {
  isHighlighting.value = true;
  setTimeout(() => {
    isHighlighting.value = false;
  }, 1500); // 闪烁3秒

  // 滚动到时区设置部分
  const element = document.getElementById("timezone-settings");
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

const highlightLoginPanel = (expandForm = false) => {
  loginPanelRef.value?.highlight(expandForm);
  // 滚动到登录面板
  const element = document.getElementById("login-panel");
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

// 生命周期钩子
onMounted(() => {
  if (route.query.highlight === "timezone") {
    highlightTimezoneSetting();
  } else if (route.query.highlight === "login") {
    highlightLoginPanel(true); // 自动展开登录表单
  }

  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has("highlight")) {
    const highlightValue = urlParams.get("highlight");

    // 处理高亮逻辑
    if (highlightValue === "timezone") {
      highlightTimezoneSetting();
    } else if (highlightValue === "login") {
      highlightLoginPanel(true); // 自动展开登录表单
    }

    // 移除highlight参数
    urlParams.delete("highlight");

    // 更新URL（不刷新页面）
    const newUrl = urlParams.toString()
      ? `${window.location.pathname}?${urlParams.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  }

  const savedTimezone = StorageManager.get("serverTimezone");
  if (savedTimezone) {
    selectedServerTimezone.value = savedTimezone;
  }

  const savedLocalTimezone = StorageManager.get("useLocalTimezone");
  useLocalTimezone.value = savedLocalTimezone === "true";

  const savedTimeFormat = StorageManager.get("timeline-time-format");
  use24HourFormat.value = savedTimeFormat !== "12";

  systemDarkMode.addEventListener("change", (e) => {
    if (selectedTheme.value === "system") {
      applySystemTheme();
    }
  });

  // 检查登录状态并设置加载标志
  const token = StorageManager.get("auth_token");
  isLoaded.value = true; // 无论是否登录，都标记页面为已加载

  // 监听isToastReady状态变化，保留以确保LoginPanel组件完全加载
  // 不再在Page3中请求用户信息API，因为App.vue已经能正确加载用户信息
  watch(isToastReady, (isReady) => {
    // console.log('isToastReady changed:', isReady);
  }, { immediate: true });
});

onUnmounted(() => {
  systemDarkMode.removeEventListener("change", applySystemTheme);
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
/* 下拉面板标题样式 */
.v-expansion-panel-title {
  padding: 12px 12px 12px 20px;
}

/* 刷新按钮样式 */
.v-expansion-panel-title .v-btn {
  margin-right: 8px;
}

.user-avatar {
  margin-right: 12px;
}

.user-details {
  flex-grow: 1;
}

.v-card {
  border-radius: 16px;
}

:deep(.v-expansion-panel) {
  border-radius: 16px;
}

.setting-root {
  background-color: #fff8;
  max-width: 1200px;
  margin: 0 auto;
}

.v-theme--dark .setting-root {
  background-color: #4448;
}

.setting-root .v-card {
  background-color: #fffa;
}

.v-theme--dark .setting-root .v-card {
  background-color: #444a;
}

.highlight-card {
  animation: highlight 0.5s ease-in-out 3;
  /* 闪烁6次(3秒) */
}

@keyframes highlight {

  0%,
  100% {
    /* background-color: #888a; */
  }

  50% {
    background-color: rgba(var(--v-theme-accent), 0.2);
    box-shadow: 0 0 10px rgba(var(--v-theme-accent), 0.5);
  }
}
</style>