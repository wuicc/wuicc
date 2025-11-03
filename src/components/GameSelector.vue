<template>
  <v-alert v-if="showInfo" type="info" class="mb-4">
    {{ $t("app.gameSelection.info") }}
  </v-alert>
  <v-row>
    <!-- 左侧游戏列表 -->
    <v-col cols="12" :sm="6" :md="12" :lg="5" class="pa-0">
      <!-- 游戏排序列表 -->
      <div class="game-order-container">
        <VueDraggable
          v-model="gameOrderList"
          :key="draggableKey"
          @start="onStart"
          @end="onEnd"
          item-key="game_id"
          :animation="150"
          ghostClass="drag-ghost"
          target=".sort-target"
          handle=".drag-handle"
          :forceFallback="true"
          :fallbackTolerance="10"
          :disabled="showInfo"
        >
          <TransitionGroup
            type="transition"
            tag="ul"
            :name="!drag ? 'game-fade' : undefined"
            class="sort-target"
          >
            <li
              v-for="(game, index) in filteredGameOrderList"
              :key="game.game_id"
              style="list-style-type: none"
              v-show="shouldShowGame(game.game_id)"
            >
              <v-card
                variant="outlined"
                rounded="xl"
                class="mb-4 game-card"
                :class="{
                  'selected-game': currentGameId === game.game_id,
                }"
                :style="{
                  '--game-bg-color': getGameColor(game.game_id) + 10,
                  '--game-color': getGameColor(game.game_id),
                }"
                @click="selectGame(game.game_id)"
              >
                <div class="d-flex align-center pa-3">
                  <v-checkbox
                    class="game-checkbox"
                    v-model="userGameSelections[game.game_id].enabled"
                    :color="getGameColor(game.game_id)"
                    hide-details
                    @click.stop="toggleGameSelection(game.game_id)"
                  ></v-checkbox>
                  <span class="text-h6">{{
                    game.name[$i18n.locale] || game.game_id
                  }}</span>
                  <v-spacer></v-spacer>
                  <div v-if="!showInfo" class="d-flex flex-column drag-handle">
                    <v-btn
                      icon
                      variant="text"
                      size="x-small"
                      :disabled="index === 0"
                      @click.stop="moveGameUp(index)"
                    >
                      <v-icon>mdi-arrow-up</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      variant="text"
                      size="x-small"
                      :disabled="index === filteredGameOrderList.length - 1"
                      @click.stop="moveGameDown(index)"
                    >
                      <v-icon>mdi-arrow-down</v-icon>
                    </v-btn>
                  </div>
                </div>
              </v-card>
            </li>
          </TransitionGroup>
        </VueDraggable>
        <div class="text-center">
          <span v-if="!showInfo" class="text-caption">
            {{ $t("app.gameSelection.dragHint") }}</span
          >
          <span v-else class="text-caption text-grey">
            {{ $t("app.gameSelection.dragHintSettings") }}</span
          >
        </div>
        <div class="text-center">
          <v-btn
            v-if="!showInfo"
            variant="flat"
            color="grey"
            size="small"
            class="ml-2"
            @click="resetGameOrder"
            prepend-icon="mdi-restore"
          >
            {{ $t("app.gameSelection.resetOrder") }}
          </v-btn>
        </div>
      </div>
    </v-col>

    <!-- 右侧活动选项 -->
    <v-col cols="12" :sm="6" :md="12" :lg="7" class="pt-0">
      <div v-if="!currentGameId" class="empty-panel">
        <v-icon size="64" color="grey lighten-1">mdi-controller</v-icon>
        <div class="text-h6 text-grey mt-4">
          {{ $t("app.gameSelection.selectGamePrompt") }}
        </div>
      </div>

      <template v-else>
        <div class="d-flex align-center mt-2 mb-2 ml-4">
          <v-avatar :color="getGameColor(currentGameId)" size="42" class="mr-3">
            <span class="text-h5" style="color: white !important">{{
              currentGameId.charAt(0).toUpperCase()
            }}</span>
          </v-avatar>
          <h2 class="text-h5">{{ getGameName(currentGameId) }}</h2>
        </div>

        <v-list class="py-0 activity-list" density="comfortable">
          <v-list-item
            v-for="(activity, activityKey) in getGameActivities(currentGameId)"
            :key="`${currentGameId}-${activityKey}`"
            @click="toggleActivitySelection(currentGameId, activityKey)"
            :disabled="!userGameSelections[currentGameId].enabled"
          >
            <template v-slot:prepend>
              <v-checkbox
                v-model="userGameSelections[currentGameId].activities"
                :value="activityKey"
                :icon="activity.icon"
                :readonly="shouldBeReadonly(currentGameId, activityKey)"
                :disabled="!userGameSelections[currentGameId].enabled"
                :color="getGameColor(currentGameId)"
                hide-details
                @click.stop
              ></v-checkbox>
            </template>

            <v-list-item-title class="text-wrap">
              <v-avatar
                :color="getGameColor(currentGameId)"
                size="24"
                class="mr-1 d-inline-block sub-icon"
              >
                <v-icon :icon="activity.icon" size="14" color="white" />
              </v-avatar>
              <span class="d-inline-flex align-center flex-wrap">
                {{ activity.name[$i18n.locale] || activityKey }}
                <v-chip
                  v-if="activity.default"
                  small
                  color="green"
                  class="ml-1"
                >
                  {{ $t("app.common.default") }}
                </v-chip>
              </span>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { i18n } from "@/i18n";
import StorageManager from "@/utils/StorageManager";
import { VueDraggable } from "vue-draggable-plus";
import { useEventsStore } from "@/store/events";

const props = defineProps({
  showInfo: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["save"]);

// 初始化 events store
const eventsStore = useEventsStore();

// 游戏数据和用户选择状态
const games = ref([]);
const userGameSelections = ref({});
const currentGameId = ref(null);
const loading = ref(false);
const gameOrderList = ref([]);
const draggableKey = ref(0);
const drag = ref(false);

// 判断是否显示特定游戏
const shouldShowGame = (gameId) => {
  const userId = StorageManager.get("user_id");
  if (gameId === "wuthering") {
    return true; // userId == 1;
  }
  return true;
};

// 获取过滤后的游戏列表（用于渲染）
const filteredGameOrderList = computed(() => {
  return gameOrderList.value.filter(game => shouldShowGame(game.game_id));
});

// 获取游戏名称
const getGameName = (gameId) => {
  const game = games.value.find((g) => g.game_id === gameId);
  return game ? game.name[i18n.global.locale.value] || gameId : gameId;
};

// 获取游戏颜色
const getGameColor = (gameId) => {
  const game = games.value.find((g) => g.game_id === gameId);
  return game ? game.color : "";
};

// 获取游戏活动
const getGameActivities = (gameId) => {
  const game = games.value.find((g) => g.game_id === gameId);
  return game ? game.activities : {};
};

// 检查某个选项是否应该为 readonly
const shouldBeReadonly = (gameId, activityKey) => {
  const activities = userGameSelections.value[gameId]
    ? userGameSelections.value[gameId].activities
    : [];
  return activities.length === 1 && activities.includes(activityKey);
};

// 根据 default 值获取默认选中的活动
const getDefaultActivities = (game) => {
  return Object.entries(game.activities)
    .filter(([_, activity]) => activity.default)
    .map(([key]) => key);
};

// 确保每个选中的游戏至少有一个子选项被选中
const enforceMinimumSelection = (gameId) => {
  if (!userGameSelections.value[gameId]) {
    return;
  }

  if (userGameSelections.value[gameId].activities.length === 0) {
    const game = games.value.find((g) => g.game_id === gameId);
    if (game) {
      userGameSelections.value[gameId].activities = getDefaultActivities(game);
    }
  }
};

// 选择游戏（设置当前游戏）
const selectGame = (gameId) => {
  currentGameId.value = gameId;
};

// 初始化游戏选择状态
const initializeGameSelection = (gameId) => {
  const game = games.value.find((g) => g.game_id === gameId);
  if (game) {
    userGameSelections.value[gameId] = {
      enabled: true,
      activities: getDefaultActivities(game),
    };
  }
};

// 切换游戏选择状态
const toggleGameSelection = (gameId) => {
  if (!userGameSelections.value[gameId]) {
    initializeGameSelection(gameId);
  } else {
    userGameSelections.value[gameId].enabled =
      !userGameSelections.value[gameId].enabled;

    if (!userGameSelections.value[gameId].enabled) {
      // 不需要额外操作，因为disabled状态会自动处理
    } else {
      // 如果启用游戏且没有活动，设置默认活动
      enforceMinimumSelection(gameId);
    }
  }

  saveSelections();
};

// 重置游戏顺序为默认
const resetGameOrder = () => {
  gameOrderList.value = [...games.value];
  saveGameOrder();
};

// 加载游戏数据
const loadGames = async (forceRefresh = false) => {
  loading.value = true;
  try {
    if (forceRefresh) {
      const response = await fetch("/api/games?t=" + Date.now());
      const data = await response.json();
      if (data.code === 200) {
        games.value = data.data.games;
        StorageManager.set("gameList", data.data.games);
      }
    } else {
      const savedGameList = StorageManager.get("gameList");
      if (savedGameList) {
        games.value = savedGameList;
      } else {
        const response = await fetch("/api/games?t=" + Date.now());
        const data = await response.json();
        if (data.code === 200) {
          games.value = data.data.games;
          StorageManager.set("gameList", data.data.games);
        }
      }
    }

    // 加载用户的选择
    const savedSelections = StorageManager.get("userGameSelections");
    if (savedSelections) {
      userGameSelections.value = {};

      games.value.forEach((game) => {
        const gameId = game.game_id;

        if (savedSelections[gameId]) {
          userGameSelections.value[gameId] = {
            enabled: savedSelections[gameId].enabled !== false,
            activities:
              savedSelections[gameId].activities || getDefaultActivities(game),
          };
        } else if (Array.isArray(savedSelections.games)) {
          const enabled = savedSelections.games.includes(gameId);
          const activities =
            savedSelections.activities && savedSelections.activities[gameId]
              ? savedSelections.activities[gameId]
              : getDefaultActivities(game);

          userGameSelections.value[gameId] = {
            enabled,
            activities,
          };
        } else {
          userGameSelections.value[gameId] = {
            enabled: false,
            activities: getDefaultActivities(game),
          };
        }
      });
    } else {
      userGameSelections.value = {};
      games.value.forEach((game) => {
        userGameSelections.value[game.game_id] = {
          enabled: false,
          activities: getDefaultActivities(game),
        };
      });
    }

    // 加载游戏顺序
    loadGameOrder();
  } catch (error) {
    console.error("Failed to load games:", error);
  } finally {
    loading.value = false;
  }
};

// 保存用户选择
const saveSelections = () => {
  Object.keys(userGameSelections.value).forEach((gameId) => {
    if (userGameSelections.value[gameId].enabled) {
      enforceMinimumSelection(gameId);
    }
  });

  const validGameIds = games.value.map((game) => game.game_id);
  const selectionsToSave = {};

  validGameIds.forEach((gameId) => {
    if (userGameSelections.value[gameId]) {
      selectionsToSave[gameId] = {
        enabled: userGameSelections.value[gameId].enabled,
        activities: [...userGameSelections.value[gameId].activities],
      };
    }
  });

  StorageManager.set("userGameSelections", selectionsToSave);
  emit("save");
  
  // 清除 store 中的活动数据
  eventsStore.clearAll();
};

// 清理无效的游戏选择
const cleanInvalidSelections = (gameList) => {
  const savedSelections = StorageManager.get("userGameSelections");
  if (!savedSelections) return;

  try {
    const validGameIds = gameList.map((game) => game.game_id);
    const selectionsToSave = {};

    validGameIds.forEach((gameId) => {
      if (savedSelections[gameId]) {
        const game = gameList.find((g) => g.game_id === gameId);
        if (game) {
          const validActivities = Object.keys(game.activities);
          const filteredActivities = savedSelections[gameId].activities.filter(
            (activityKey) => validActivities.includes(activityKey)
          );

          const activities =
            filteredActivities.length > 0
              ? filteredActivities
              : getDefaultActivities(game);

          selectionsToSave[gameId] = {
            enabled: savedSelections[gameId].enabled,
            activities,
          };
        }
      }
    });

    StorageManager.set("userGameSelections", selectionsToSave);
  } catch (error) {
    console.error("Error cleaning invalid selections:", error);
  }
};

// 切换活动选择状态
const toggleActivitySelection = (gameId, activityKey) => {
  if (shouldBeReadonly(gameId, activityKey)) return;

  if (!userGameSelections.value[gameId]) {
    initializeGameSelection(gameId);
  }

  const activities = userGameSelections.value[gameId].activities;
  const index = activities.indexOf(activityKey);

  if (index === -1) {
    activities.push(activityKey);
  } else {
    activities.splice(index, 1);

    if (activities.length === 0) {
      const game = games.value.find((g) => g.game_id === gameId);
      if (game) {
        const defaultActivity = getDefaultActivities(game)[0];
        if (defaultActivity) {
          activities.push(defaultActivity);
        }
      }
    }
  }

  saveSelections();
};

// 加载游戏顺序
const loadGameOrder = () => {
  try {
    const savedOrder = StorageManager.get("gameOrder") || [];

    if (savedOrder.length > 0) {
      // 创建游戏ID到索引的映射
      const orderMap = new Map(savedOrder.map((id, index) => [id, index]));

      // 对游戏列表进行排序
      gameOrderList.value = [...games.value].sort((a, b) => {
        const aIndex = orderMap.has(a.game_id)
          ? orderMap.get(a.game_id)
          : Infinity;
        const bIndex = orderMap.has(b.game_id)
          ? orderMap.get(b.game_id)
          : Infinity;
        return aIndex - bIndex;
      });
    } else {
      gameOrderList.value = [...games.value];
    }
  } catch (error) {
    console.error("加载游戏顺序失败:", error);
    gameOrderList.value = [...games.value];
  }
};

// 保存游戏顺序
const saveGameOrder = () => {
  const order = gameOrderList.value.map((game) => game.game_id);
  StorageManager.set("gameOrder", order);
};

// 移动游戏位置
const moveGameUp = (index) => {
  if (index <= 0) return;

  const temp = gameOrderList.value[index - 1];
  gameOrderList.value[index - 1] = gameOrderList.value[index];
  gameOrderList.value[index] = temp;

  saveGameOrder();
};

const moveGameDown = (index) => {
  if (index >= gameOrderList.value.length - 1) return;

  const temp = gameOrderList.value[index + 1];
  gameOrderList.value[index + 1] = gameOrderList.value[index];
  gameOrderList.value[index] = temp;

  saveGameOrder();
};

// 拖拽相关方法
const onStart = () => {
  drag.value = true;
};

const onEnd = (evt) => {
  nextTick(() => {
    drag.value = false;
    if (evt.oldIndex === evt.newIndex) {
      draggableKey.value++;
      return;
    }
    saveGameOrder();
  });
};

// 暴露方法供父组件调用
defineExpose({
  refresh: (force = false) => loadGames(force),
  clean: (gameList) => cleanInvalidSelections(gameList),
});

// 初始化加载
onMounted(() => {
  loadGames();
});
</script>

<style scoped>
.game-card {
  transition: all 0.3s ease;
  cursor: pointer;
  user-select: none;
}

.game-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.game-checkbox {
  transform: scale(1.2);
  margin-right: 8px;
}

.selected-game {
  border-left: 4px solid var(--game-color);
  background-color: var(--game-bg-color);
}

.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  text-align: center;
}

.activity-list {
  max-height: 70vh;
  overflow-y: auto;
}

.game-icon {
  width: 32px;
  height: 32px;
}

.game-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
}

.sub-icon {
  vertical-align: middle;
  line-height: 20px;
}

.v-list-item-title {
  white-space: normal !important;
  word-break: break-word;
}

/* 排序相关样式 */
.game-order-container {
  padding: 8px;
  border-radius: 4px;
}

.drag-ghost {
  opacity: 0.8;
  background: #aaa !important;
  border-radius: 24px;
  /* border-radius: 24px 4px 24px 4px; */
}

.game-fade-move,
.game-fade-enter-active,
.game-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}

.game-fade-enter-from,
.game-fade-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}

.game-fade-leave-active {
  position: absolute;
}

.sort-target {
  padding: 0;
}

/* 响应式调整 */
@media (max-width: 1263px) and (min-width: 960px), (max-width: 599px) {
  .activity-list {
    max-height: none;
    overflow-y: visible;
  }

  .empty-panel {
    min-height: 200px;
  }
}
</style>