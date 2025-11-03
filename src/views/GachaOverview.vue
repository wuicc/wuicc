<template>
  <div class="gacha-overview">
    <v-card class="mb-2 gacha-overview-card">
      <v-card-title class="d-flex align-center flex-wrap">
        <div class="d-flex align-center mr-2">
          <v-icon class="mr-2">mdi-crystal-ball</v-icon>
          {{ $t("app.pages.gacha.overview.title") }}
        </div>

        <v-spacer></v-spacer>

        <!-- 游戏选择器和账号按钮容器 -->
        <div class="game-selector-container">
          <v-select v-model="selectedGame" :items="gameOptions" item-title="name" item-value="id"
            :label="$t('app.pages.gacha.overview.selectGame')" variant="outlined" density="compact" hide-details="auto"
            style="width: 200px" :color="getGameColor(selectedGame)">
            <template v-slot:selection="{ item }">
              <v-chip :color="getGameColor(item.value)" variant="tonal" size="small">
                {{ item.title }}
              </v-chip>
            </template>
          </v-select>
        </div>

        <!-- 账号管理按钮 -->
        <v-btn icon variant="text" class="account-btn" @click="accountDialog = true">
          <v-icon>mdi-account-circle</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <!-- 无选中UID提示 -->
        <div v-if="!currentSelectedUid" class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-account-question</v-icon>
          <div class="text-h6 text-grey mt-4">
            {{ $t("app.pages.gacha.overview.noUidSelected") }}
          </div>
          <v-btn color="accent" class="mt-4" @click="accountDialog = true">
            <v-icon left>mdi-account-cog</v-icon>
            {{ $t("app.pages.gacha.overview.selectUid") }}
          </v-btn>
        </div>

        <!-- 有选中UID时的统计数据 -->
        <div v-else>
          <!-- 当前UID信息 -->
          <v-alert variant="tonal" :color="getGameColor(selectedGame)" class="mb-4 rounded-xl">
            <div class="d-flex align-center">
              <v-chip :color="getGameColor(selectedGame)" variant="tonal" class="mr-2">
                {{ getGameName(selectedGame) }}
              </v-chip>
              <span class="text-body-1">{{ currentSelectedUid }}</span>
            </div>
          </v-alert>

          <!-- 按卡池类型分类的统计 -->
          <v-row>
            <v-col v-for="gachaType in gachaTypeStats" :key="gachaType.id" cols="12" sm="6" md="4">
              <v-card class="item-card h-100" variant="tonal" :color="getGameColor(selectedGame)">
                <v-card-title class="text-subtitle-1 d-flex align-center">
                  <v-chip :color="getGameColor(selectedGame)" variant="tonal" size="small" class="mr-2">
                    {{ gachaType.name }}
                  </v-chip>
                  <span class="text-caption text-high-emphasis">
                    {{ gachaType.count }}
                    {{ $t("app.pages.gacha.overview.pulls") }}
                  </span>
                  <v-spacer></v-spacer>
                  <v-btn icon variant="text" @click="navigateToRecords(gachaType.id)" class="text-medium-emphasis"
                    density="comfortable">
                    <v-icon>mdi-arrow-right</v-icon>
                  </v-btn>
                </v-card-title>

                <v-card-text class="pt-0">
                  <v-row>
                    <!-- 五星/S级统计 -->
                    <v-col cols="6">
                      <v-card class="item-card text-center" variant="flat" color="orange-darken-4
                        ">
                        <v-card-text class="pa-2">
                          <v-icon size="32">mdi-star</v-icon>
                          <div class="text-h5 font-weight-bold mt-1">
                            {{
                              selectedGame === "zenless"
                                ? gachaType.sRankCount
                                : gachaType.fiveStarCount
                            }}
                          </div>
                          <div class="text-caption">
                            {{
                              selectedGame === "zenless"
                                ? $t("app.pages.gacha.overview.sRankCount")
                                : $t("app.pages.gacha.overview.fiveStarCount")
                            }}
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>

                    <!-- 四星/A级统计 -->
                    <v-col cols="6">
                      <v-card class="item-card text-center" variant="flat" color="purple">
                        <v-card-text class="pa-2">
                          <v-icon size="32">mdi-star-four-points</v-icon>
                          <div class="text-h5 font-weight-bold mt-1">
                            {{
                              selectedGame === "zenless"
                                ? gachaType.aRankCount
                                : gachaType.fourStarCount
                            }}
                          </div>
                          <div class="text-caption">
                            {{
                              selectedGame === "zenless"
                                ? $t("app.pages.gacha.overview.aRankCount")
                                : $t("app.pages.gacha.overview.fourStarCount")
                            }}
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- 查看详情按钮 -->
          <div class="text-center mt-4">
            <v-btn class="text-white" size="large" variant="elevated" :color="getGameColor(selectedGame)"
              :to="{ name: 'GachaRecords' }" prepend-icon="mdi-format-list-bulleted" :disabled="!hasRecords">
              {{ $t("app.pages.gacha.records.title") }}
            </v-btn>
            <div v-if="!hasRecords" class="text-caption text-medium-emphasis mt-2">
              {{ $t("app.pages.gacha.overview.noRecordsHint") }}
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
    <!-- 游戏统计图表区域 (预留) -->
    <v-card class="mt-4 gacha-overview-card">
      <v-card-title>
        <v-icon class="mr-2">mdi-chart-line</v-icon>
        {{ $t("app.pages.gacha.overview.chartTitle") }}
      </v-card-title>
      <v-card-text class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-chart-arc</v-icon>
        <div class="text-h6 text-grey mt-4">{{ $t("app.pages.gacha.overview.chartComingSoon") }}</div>
      </v-card-text>
    </v-card>
    <!-- 在模板底部添加弹窗 -->
    <v-dialog v-model="accountDialog" max-width="800">
      <v-card>
        <v-card-title class="d-flex align-center sticky-dialog-header">
          <div class="text-h6">
            {{ $t("app.pages.gacha.settings.title") }}
          </div>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="accountDialog = false" class="ml-2">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider style="position: sticky;top: 65px;z-index: 9999;"></v-divider>
        <v-card-text class="px-1 pt-0 pb-2">
          <GachaSettings :user="{
            user_id: authStore.user.id,
            username: authStore.user.username,
            nickname: authStore.user.nickname,
            avatar: authStore.user.avatar
          }" @recordsUpdated="handleRecordsUpdated" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import StorageManager from "@/utils/StorageManager";
import { IndexedDBManager } from "@/utils/IndexedDBManager";
import GachaSettings from "@/components/GachaSettings.vue";
import { useAuthStore } from "@/store/auth";

const { t } = useI18n();
const router = useRouter();

// 初始化auth store
const authStore = useAuthStore();

// 响应式数据
const accountDialog = ref(false);
const loading = ref(true);
const gachaRecords = ref([]);
const rawGachaTypeStats = ref([]);
const gachaUids = ref(
  StorageManager.get("gachaUids") || { selected: {}, downloaded: {} }
);
// 用于显示的游戏ID，确保数据加载完成前使用原游戏ID显示卡池名称
const displayGameId = ref(StorageManager.get("gachaSelectedGame") || "genshin");

const gachaTypeStats = computed(() => {
  return rawGachaTypeStats.value.map((stat) => ({
    ...stat,
    name: getGachaTypeName(displayGameId.value, stat.id),
    sRankCount: stat.fiveStarCount, // 为Zenless游戏添加S级统计
    aRankCount: stat.fourStarCount, // 为Zenless游戏添加A级统计
  }));
});

const dbManager = new IndexedDBManager("GachaTrackerDB_v2");
const dbInitialized = ref(false);

// 初始化存储结构
const initStorageStructure = () => {
  if (!StorageManager.get("gachaSelectedGame")) {
    StorageManager.set("gachaSelectedGame", "genshin");
  }
};

initStorageStructure();
const selectedGame = ref(StorageManager.get("gachaSelectedGame") || "genshin");

// 当前选中的UID
const currentSelectedUid = computed(() => {
  return gachaUids.value.selected[selectedGame.value] || null;
});

// 游戏选项
const gameOptions = computed(() => [
  { id: "genshin", name: t("app.games.genshin.title") },
  { id: "starrail", name: t("app.games.starrail.title") },
  { id: "zenless", name: t("app.games.zenless.title") },
  { id: "wuthering", name: t("app.games.wuthering.title") },
]);

// 获取游戏名称
const getGameName = (gameId) => {
  const games = {
    genshin: t("app.games.genshin.title"),
    starrail: t("app.games.starrail.title"),
    zenless: t("app.games.zenless.title"),
    wuthering: t("app.games.wuthering.title"),
  };
  return games[gameId] || gameId;
};

// 获取游戏颜色
const getGameColor = (gameId) => {
  try {
    const gameList = StorageManager.get("gameList") || [];
    const game = gameList.find((g) => g.game_id === gameId);
    return game ? game.color : "#607D8B";
  } catch (error) {
    console.error("Failed to load game color:", error);
    return "#607D8B";
  }
};

// 获取卡池类型名称
const getGachaTypeName = (gameId, gachaType) => {
  const typeMaps = {
    genshin: {
      301: t("app.pages.gacha.types.genshin.301"),
      302: t("app.pages.gacha.types.genshin.302"),
      500: t("app.pages.gacha.types.genshin.500"),
      200: t("app.pages.gacha.types.genshin.200"),
      100: t("app.pages.gacha.types.genshin.100"),
    },
    starrail: {
      11: t("app.pages.gacha.types.starrail.11"),
      12: t("app.pages.gacha.types.starrail.12"),
      21: t("app.pages.gacha.types.starrail.21"),
      22: t("app.pages.gacha.types.starrail.22"),
      1: t("app.pages.gacha.types.starrail.1"),
      2: t("app.pages.gacha.types.starrail.2"),
    },
    zenless: {
      2: t("app.pages.gacha.types.zenless.2"),
      1: t("app.pages.gacha.types.zenless.1"),
      3: t("app.pages.gacha.types.zenless.3"),
      5: t("app.pages.gacha.types.zenless.5"),
    },
    wuthering: {
      1: t("app.pages.gacha.types.wuthering.1"),
      2: t("app.pages.gacha.types.wuthering.2"),
      3: t("app.pages.gacha.types.wuthering.3"),
      4: t("app.pages.gacha.types.wuthering.4"),
      5: t("app.pages.gacha.types.wuthering.5"),
      6: t("app.pages.gacha.types.wuthering.6"),
      7: t("app.pages.gacha.types.wuthering.7"),
      8: t("app.pages.gacha.types.wuthering.8"),
      9: t("app.pages.gacha.types.wuthering.9"),
    },
  };
  return typeMaps[gameId]?.[gachaType] || gachaType;
};

// 导航到记录页面并设置选中的卡池类型
const navigateToRecords = (gachaTypeId) => {
  // 获取当前的卡池选择设置
  const gachaSelections = StorageManager.get('gachaSelections') || {
    genshin: '301',
    starrail: '11',
    zenless: '2',
    wuthering: '1',
  };

  // 更新当前游戏的卡池类型选择
  gachaSelections[selectedGame.value] = gachaTypeId.toString();

  // 保存到本地存储
  StorageManager.set('gachaSelections', gachaSelections);

  // 导航到记录页面
  router.push({ name: 'GachaRecords' });
};

const hasRecords = computed(() => {
  return gachaRecords.value.length > 0;
});

// 更新 gachaUids 的方法
const updateGachaUids = () => {
  const newUids = StorageManager.get("gachaUids") || {
    selected: {},
    downloaded: {},
  };
  // 只有当数据确实发生变化时才更新
  if (JSON.stringify(newUids) !== JSON.stringify(gachaUids.value)) {
    gachaUids.value = newUids;
  }
};

// 加载抽卡记录数据
const loadGachaRecords = async () => {
  if (!currentSelectedUid.value) {
    gachaRecords.value = [];
    rawGachaTypeStats.value = [];
    return;
  }

  try {
    loading.value = true;

    if (!dbInitialized.value) {
      await dbManager.openDB();
      dbInitialized.value = true;
    }

    const tableName = `${selectedGame.value}-${currentSelectedUid.value}`;
    const allRecords = await dbManager.getAllGachaRecords(tableName);
    gachaRecords.value = allRecords;

    const gachaTypeOrder = {
      genshin: [301, 302, 500, 200, 100],
      starrail: [11, 12, 21, 22, 1, 2],
      zenless: [2, 3, 1, 5],
      wuthering: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    };

    const statsMap = {};
    allRecords.forEach((record) => {
      const gachaType = record.uigf_gacha_type;

      if (!statsMap[gachaType]) {
        statsMap[gachaType] = {
          id: gachaType,
          count: 0,
          fiveStarCount: 0,
          fourStarCount: 0,
          sRankCount: 0,
          aRankCount: 0,
        };
      }

      statsMap[gachaType].count++;

      if (
        record.rank_type === "5" ||
        (selectedGame.value === "zenless" && record.rank_type === "4")
      ) {
        statsMap[gachaType].fiveStarCount++;
        statsMap[gachaType].sRankCount++;
      } else if (
        record.rank_type === "4" ||
        (selectedGame.value === "zenless" && record.rank_type === "3")
      ) {
        statsMap[gachaType].fourStarCount++;
        statsMap[gachaType].aRankCount++;
      }
    });

    const orderedStats = [];
    const currentGameOrder = gachaTypeOrder[selectedGame.value] || [];

    currentGameOrder.forEach((type) => {
      if (statsMap[type]) {
        orderedStats.push(statsMap[type]);
      }
    });

    Object.keys(statsMap).forEach((type) => {
      const typeNum = parseInt(type);
      if (!currentGameOrder.includes(typeNum) && statsMap[type]) {
        orderedStats.push(statsMap[type]);
      }
    });

    // 只有当数据加载完成后，才更新显示游戏ID并设置新数据
    rawGachaTypeStats.value = orderedStats;
    displayGameId.value = selectedGame.value;
  } catch (error) {
    console.error("Failed to load gacha records:", error);
    gachaRecords.value = [];
    rawGachaTypeStats.value = [];
    // 错误情况下，如果有数据加载失败，仍然更新显示游戏ID以避免不一致
    displayGameId.value = selectedGame.value;
  } finally {
    loading.value = false;
  }
};

// 保存游戏选择
const saveGameSelection = () => {
  StorageManager.set("gachaSelectedGame", selectedGame.value);
};

const handleRecordsUpdated = async (payload) => {
  updateGachaUids();
  await loadGachaRecords();
};

// 监听游戏选择变化
watch(selectedGame, (newVal) => {
  saveGameSelection();
  // 注意：这里不立即更新displayGameId，而是在数据加载完成后更新
  loadGachaRecords();
});

// 监听选中UID的变化
watch(
  () => gachaUids.value.selected[selectedGame.value],
  (newUid, oldUid) => {
    if (newUid !== oldUid) {
      loadGachaRecords();
    }
  }
);

// 监听 StorageManager 的变化
const setupStorageListener = () => {
  window.addEventListener("storage", (event) => {
    if (event.key === "gachaUids") {
      updateGachaUids();
    }
  });
};

onMounted(async () => {
  await loadGachaRecords();
  setupStorageListener();
});
</script>

<style scoped>
.gacha-overview {
  max-width: 1200px;
  margin: 0 auto;
}

.v-table {
  background-color: #fff8;
}

.v-theme--dark .v-table {
  background-color: #4448;
}

.v-card {
  border-radius: 16px;
}

.gacha-overview-card {
  background-color: #fffa;
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); */
}

.v-theme--dark .gacha-overview-card {
  background-color: #444a;
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); */
}

.text-h4 {
  font-family: "Roboto", sans-serif;
  letter-spacing: -0.5px;
}

/* 卡片悬停效果 */
.gacha-overview :deep(.item-card) {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.gacha-overview :deep(.item-card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.v-theme--dark .gacha-overview :deep(.item-card:hover) {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.h-100 {
  height: 100%;
}

.sticky-dialog-header {
  position: sticky;
  top: 0;
  /* background-color: #fff; */
  z-index: 1000;
}

.v-theme--dark .sticky-dialog-header {
  background-color: rgb(33, 33, 33);
}

/* 默认布局 - 宽度大于600px时 */
@media (min-width: 601px) {
  .v-card-title {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
  }

  /* 账号按钮位于游戏选择器右侧 */
  .account-btn {
    margin-left: 8px;
    margin-right: 0;
  }
}

/* 响应式布局 - 屏幕宽度小于等于600px时 */
@media (max-width: 600px) {
  .v-card-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  /* 标题区域占据大部分空间 */
  .v-card-title>div:first-child {
    flex: 1;
    min-width: 0;
    margin-bottom: 0;
  }

  /* 账号按钮在标题行的右侧 */
  .account-btn {
    margin-left: auto;
    margin-right: 0;
    margin-bottom: 0;
    order: 2;
  }

  /* 游戏选择器容器移到第二行并靠右 */
  .game-selector-container {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
    padding-right: 4px;
    order: 3;
  }

  /* 游戏选择器宽度适应移动设备 */
  .game-selector-container .v-select {
    width: 180px;
  }
}
</style>