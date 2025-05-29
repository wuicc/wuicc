<template>
  <div>
    <v-alert v-if="showInfo" type="info" class="mb-4">
      {{ $t("app.gameSelection.info") }}
    </v-alert>

    <!-- 游戏卡片列表 -->
    <v-card
      v-for="game in games"
      :key="game.game_id"
      class="mb-4"
      :class="{ 'selected-game': selectedGames.includes(game.game_id) }"
      @click.stop
      :ripple="false"
    >
      <div
        class="d-flex align-center pa-4"
        @click.stop="toggleGameSelection(game.game_id)"
        :ripple="false"
      >
        <v-checkbox
          v-model="selectedGames"
          :value="game.game_id"
          class="mr-2"
          color="accent"
          hide-details
          @click.stop
        ></v-checkbox>

        <v-avatar :color="game.color" size="40" class="mr-3">
          <v-img :src="game.icon" :alt="game.name[$i18n.locale]" />
        </v-avatar>

        <span class="text-h6 flex-grow-1">{{
          game.name[$i18n.locale] || game.game_id
        }}</span>

        <v-chip small :color="game.color" text-color="white" class="ml-2">
          {{ game.game_id }}
        </v-chip>
      </div>

      <!-- 活动选项 - 只在勾选时显示 -->
      <v-expand-transition>
        <div v-if="selectedGames.includes(game.game_id)">
          <v-divider></v-divider>
          <v-list class="py-0" density="compact">
            <v-list-item
              v-for="(activity, activityKey) in game.activities"
              :key="`${game.game_id}-${activityKey}`"
              @click.stop="toggleActivitySelection(game.game_id, activityKey)"
            >
              <template v-slot:prepend>
                <v-checkbox
                  v-model="selectedActivities[game.game_id]"
                  :value="activityKey"
                  :icon="activity.icon"
                  :readonly="shouldBeReadonly(game.game_id, activityKey)"
                  color="accent"
                  hide-details
                  @click.stop
                ></v-checkbox>
              </template>

              <v-list-item-title>
                <v-icon :icon="activity.icon" class="mr-2"></v-icon>
                {{ activity.name[$i18n.locale] || activityKey }}
                <v-chip
                  v-if="activity.default"
                  small
                  color="green"
                  class="ml-2"
                >
                  {{ $t("app.default") }}
                </v-chip>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </v-expand-transition>
    </v-card>

    <v-btn color="accent" @click="saveSelections" size="large" class="mt-4">
      <v-icon left>mdi-content-save</v-icon>
      {{ saveButtonText }}
    </v-btn>
  </div>
</template>


<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { i18n } from "@/i18n";

const props = defineProps({
  showInfo: {
    type: Boolean,
    default: true,
  },
  saveButtonText: {
    type: String,
    default: i18n.global.t("app.gameSelection.save"),
  },
});

const emit = defineEmits(["save"]);

// 游戏数据和用户选择状态
const games = ref([]);
const selectedGames = ref([]);
const selectedActivities = ref({});
const loading = ref(false);

// 检查某个选项是否应该为 readonly
const shouldBeReadonly = (gameId, activityKey) => {
  const activities = selectedActivities.value[gameId] || [];
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
  if (
    !selectedActivities.value[gameId] ||
    selectedActivities.value[gameId].length === 0
  ) {
    const game = games.value.find((g) => g.game_id === gameId);
    if (game) {
      // 根据 default 值设置默认选中项
      selectedActivities.value[gameId] = getDefaultActivities(game);
    }
  }
};

// 监听 selectedGames 变化
watch(
  selectedGames,
  (newVal, oldVal) => {
    // 对新选中的游戏初始化子选项
    newVal.forEach((gameId) => {
      if (!selectedActivities.value[gameId]) {
        enforceMinimumSelection(gameId);
      }
    });

    // 对取消选择的游戏清理数据
    oldVal.forEach((gameId) => {
      if (!newVal.includes(gameId)) {
        delete selectedActivities.value[gameId];
      }
    });
  },
  { deep: true }
);

// 加载游戏数据
const loadGames = async (forceRefresh = false) => {
  loading.value = true;
  try {
    if (forceRefresh) {
      // 强制从API获取
      const response = await fetch("/api/games?t=" + Date.now());
      const data = await response.json();
      if (data.code === 200) {
        games.value = data.data.games;
        localStorage.setItem("gameList", JSON.stringify(data.data.games));
      }
    } else {
      // 尝试从localStorage加载
      const savedGameList = localStorage.getItem("gameList");
      if (savedGameList) {
        games.value = JSON.parse(savedGameList);
      } else {
        // 从API获取
        const response = await fetch("/api/games");
        const data = await response.json();
        if (data.code === 200) {
          games.value = data.data.games;
          localStorage.setItem("gameList", JSON.stringify(data.data.games));
        }
      }
    }

    // 加载用户的选择
    const savedSelections = localStorage.getItem("userGameSelections");
    if (savedSelections) {
      const { games: savedGames, activities: savedActivities } =
        JSON.parse(savedSelections);

      // 更新选中的游戏
      selectedGames.value = savedGames || [];

      // 更新选中的活动
      if (savedActivities) {
        selectedActivities.value = {};
        savedGames.forEach((gameId) => {
          const game = games.value.find((g) => g.game_id === gameId);
          if (game) {
            // 如果有保存的选择，使用保存的值
            if (savedActivities[gameId] && savedActivities[gameId].length > 0) {
              selectedActivities.value[gameId] = [...savedActivities[gameId]];
            } else {
              // 否则使用默认值
              selectedActivities.value[gameId] = getDefaultActivities(game);
            }
          }
        });
      }
    } else {
      // 全新用户，根据默认值初始化
      selectedActivities.value = {};
      games.value.forEach((game) => {
        if (selectedGames.value.includes(game.gameId)) {
          selectedActivities.value[game.gameId] = getDefaultActivities(game);
        }
      });
    }
  } catch (error) {
    console.error("Failed to load games:", error);
  } finally {
    loading.value = false;
  }
};

// 保存用户选择
const saveSelections = () => {
  // 确保每个选中的游戏至少有一个子选项
  selectedGames.value.forEach((gameId) => {
    enforceMinimumSelection(gameId);
  });

  const selections = {
    games: selectedGames.value,
    activities: selectedActivities.value,
  };
  const gameList = JSON.parse(localStorage.getItem("gameList") || "[]");
  cleanInvalidSelections(gameList);

  localStorage.setItem("userGameSelections", JSON.stringify(selections));
  emit("save", selections);
};
// 清理无效的游戏选择
const cleanInvalidSelections = (gameList) => {
  const savedSelections = localStorage.getItem("userGameSelections");
  if (!savedSelections) return;

  try {
    const selections = JSON.parse(savedSelections);
    const validGameIds = gameList.map((game) => game.game_id);

    // 过滤掉不存在的游戏
    const filteredGames = selections.games.filter((gameId) =>
      validGameIds.includes(gameId)
    );

    // 过滤掉不存在的活动
    const filteredActivities = {};
    filteredGames.forEach((gameId) => {
      if (selections.activities[gameId]) {
        const game = gameList.find((g) => g.game_id === gameId);
        if (game) {
          const validActivityKeys = Object.keys(game.activities);
          filteredActivities[gameId] = selections.activities[gameId].filter(
            (activityKey) => validActivityKeys.includes(activityKey)
          );

          // 确保至少有一个活动被选中
          if (filteredActivities[gameId].length === 0) {
            const defaultActivities = Object.entries(game.activities)
              .filter(([_, activity]) => activity.default)
              .map(([key]) => key);
            filteredActivities[gameId] = defaultActivities;
          }
        }
      }
    });

    // 如果有变化，则更新本地存储
    if (
      filteredGames.length !== selections.games.length ||
      JSON.stringify(filteredActivities) !==
        JSON.stringify(selections.activities)
    ) {
      localStorage.setItem(
        "userGameSelections",
        JSON.stringify({
          games: filteredGames,
          activities: filteredActivities,
        })
      );
    }
  } catch (error) {
    console.error("Error cleaning invalid selections:", error);
  }
};

// 切换游戏选择状态
const toggleGameSelection = (gameId) => {
  const index = selectedGames.value.indexOf(gameId);
  if (index === -1) {
    selectedGames.value.push(gameId);
    enforceMinimumSelection(gameId);
  } else {
    selectedGames.value.splice(index, 1);
    delete selectedActivities.value[gameId];
  }
};

// 切换活动选择状态
const toggleActivitySelection = (gameId, activityKey) => {
  if (shouldBeReadonly(gameId, activityKey)) return;

  if (!selectedActivities.value[gameId]) {
    selectedActivities.value[gameId] = [];
  }

  const index = selectedActivities.value[gameId].indexOf(activityKey);
  if (index === -1) {
    selectedActivities.value[gameId].push(activityKey);
  } else {
    selectedActivities.value[gameId].splice(index, 1);

    // 确保至少有一个活动被选中
    if (selectedActivities.value[gameId].length === 0) {
      const game = games.value.find((g) => g.game_id === gameId);
      if (game) {
        const defaultActivity = getDefaultActivities(game)[0];
        if (defaultActivity) {
          selectedActivities.value[gameId].push(defaultActivity);
        }
      }
    }
  }
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
.v-card {
  transition: all 0.3s ease;
  overflow: hidden;
}

.selected-game {
  border-left: 4px solid rgba(var(--v-theme-accent), 0.8);
  box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.1);
}

.v-list-item {
  padding-left: 12px;
  min-height: 48px;
}

.v-chip {
  font-weight: 500;
  letter-spacing: 0.5px;
}

.v-btn {
  line-height: 20px;
}
</style>