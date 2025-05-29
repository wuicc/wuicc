<template>
  <v-card>
    <v-card-title class="text-h5">
      {{ $t("app.pages.settings.title") }}
    </v-card-title>

    <v-card-text>
      <!-- 游戏设置下拉面板 -->

      <!-- 其他设置项 - 两列布局 -->
      <v-row>
        <v-col cols="12" md="6">
          <v-expansion-panels class="mb-6" v-model="panel">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <template v-slot:default="{ expanded }">
                  <div class="d-flex align-center w-100">
                    <v-icon class="mr-2">mdi-controller</v-icon>
                    <span class="text-h6">{{
                      $t("app.settings.gameSelection.title")
                    }}</span>

                    <v-spacer></v-spacer>

                    <!-- 仅在展开时显示刷新按钮 -->
                    <v-btn
                      v-if="expanded"
                      icon
                      variant="text"
                      size="small"
                      @click.stop="forceRefreshGames"
                      :loading="loading"
                      :disabled="loading"
                    >
                      <v-icon>mdi-refresh</v-icon>
                      <template v-slot:loader>
                        <v-progress-circular
                          indeterminate
                          size="24"
                        ></v-progress-circular>
                      </template>
                    </v-btn>
                  </div>
                </template>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <GameSelector
                  ref="gameSelector"
                  :show-info="false"
                  :save-button-text="$t('app.settings.gameSelection.save')"
                  @save="handleSave"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="mb-4">
            <v-card-title class="text-h6">
              <v-icon left>mdi-palette</v-icon>
              {{ $t("app.settings.theme.title") }}
            </v-card-title>
            <v-card-text>
              <v-select
                :items="themeOptions"
                :label="$t('app.settings.theme.selectLabel')"
                v-model="selectedTheme"
                @update:modelValue="changeTheme"
              ></v-select>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <AppToast ref="toast" />
  </v-card>
</template>

<script setup>
import { ref } from "vue";
import { i18n } from "@/i18n";
import GameSelector from "@/components/GameSelector.vue";
import AppToast from "@/components/AppToast.vue"; // 引入新组件

const loading = ref(false);
const gameSelector = ref(null);
const toast = ref(null); // 添加 toast 引用
const panel = ref(["games"]);

import { useTheme } from "vuetify";
import { useDisplay } from "vuetify";

const theme = useTheme();
const { mobile } = useDisplay();
import { computed } from "vue";

// 将静态数组改为计算属性
const themeOptions = computed(() => [
  { title: i18n.global.t("app.settings.theme.system"), value: "system" },
  { title: i18n.global.t("app.settings.theme.light"), value: "light" },
  { title: i18n.global.t("app.settings.theme.dark"), value: "dark" },
]);

// 强制从服务器刷新游戏数据
const forceRefreshGames = async () => {
  loading.value = true;
  try {
    await gameSelector.value?.refresh(true);
    // 刷新后清理无效选择
    const gameList = JSON.parse(localStorage.getItem("gameList") || "[]");
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

// 修改 handleSave 方法
const handleSave = () => {
  toast.value.showToast(
    i18n.global.t("app.settings.gameSelection.saved"),
    "success"
  );
};

const selectedTheme = ref(localStorage.getItem("theme") || "system");

// 检测系统主题变化
const systemDarkMode = window.matchMedia("(prefers-color-scheme: dark)");

// 切换主题
const changeTheme = (themeName) => {
  selectedTheme.value = themeName;
  localStorage.setItem("theme", themeName);

  if (themeName === "system") {
    applySystemTheme();
  } else {
    theme.global.name.value = themeName;
  }
};

// 应用系统主题
const applySystemTheme = () => {
  const isSystemDark = systemDarkMode.matches;
  theme.global.name.value = isSystemDark ? "dark" : "light";
};

// 监听系统主题变化
systemDarkMode.addEventListener("change", (e) => {
  if (selectedTheme.value === "system") {
    applySystemTheme();
  }
});

</script>

<style scoped>
/* 响应式调整 */
/* .v-card {
  height: 100%;
} */

/* 下拉面板标题样式 */
.v-expansion-panel-title {
  padding: 16px;
}

/* 刷新按钮样式 */
.v-expansion-panel-title .v-btn {
  margin-right: 8px;
}
</style>