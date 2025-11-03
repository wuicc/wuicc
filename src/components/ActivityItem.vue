<template>
  <div>
    <!-- 活动块 -->
    <div
      class="activity-item"
      :style="activityStyle"
      @mousedown="handleMouseDown"
      @click="openDialog"
      :data-activity-uuid="activity.uuid"
    >
      <!-- 添加sticky容器包裹状态图标和标题 -->
      <div class="sticky-container">
        <div class="activity-content">
          <v-menu
            v-model="showStatusPanel"
            :activator="statusActivatorRef"
            :close-on-content-click="false"
            offset-y
            scrollStrategy="close"
          >
            <template v-slot:activator="{ on, attrs }">
              <div ref="statusActivatorRef" class="status-icon" v-bind="attrs">
                {{ statusIcon }}
              </div>
            </template>

            <v-card width="55px">
              <v-list dense density="compact" class="text-center">
                <v-list-item @click="setStatus('')">
                  <v-list-item-title>⬜</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setStatus('done')">
                  <v-list-item-title>✅</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setStatus('in_progress')">
                  <v-list-item-title>⏩</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setStatus('starred')">
                  <v-list-item-title>⭐</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setStatus('cancelled')">
                  <v-list-item-title>❌</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
          <span class="activity-title">{{ formattedTitle }}</span>
        </div>
      </div>
      <img
        v-if="activity.banner_img"
        :src="activity.banner_img"
        class="activity-banner"
        :style="bannerStyle"
        referrerpolicy="no-referrer"
      />
    </div>

    <!-- 左侧倒计时（未开始的活动） -->
    <div
      v-if="showLeftIndicator"
      class="time-indicator left"
      :style="leftIndicatorStyle"
    >
      {{ formattedTimeRemaining }}
    </div>

    <!-- 右侧倒计时（已开始的活动） -->
    <div
      v-if="showRightIndicator"
      class="time-indicator right"
      :class="timeIndicatorClass"
      :style="rightIndicatorStyle"
    >
      {{ formattedTimeRemaining }}
    </div>

    <!-- 活动详情弹窗 -->
    <v-dialog v-model="dialog" max-width="650">
      <v-card>
        <v-img
          :src="activity.banner_img"
          min-height="100px"
          max-height="360px"
          cover
          referrerpolicy="no-referrer"
        ></v-img>
        <v-card-title>{{
          activity.type === "event" && activity.game_id !== "zenless"
            ? activity.title
            : formattedTitle
        }}</v-card-title>
        <v-card-subtitle>
          {{ formatDate(activity.start_time) }} -
          {{ formatDate(activity.end_time) }}
        </v-card-subtitle>

        <!-- 弹窗内的倒计时 -->
        <v-card-text v-if="dialogTimeRemainingText" class="dialog-timer">
          {{ dialogTimeRemainingText }}
        </v-card-text>

        <!-- 投票部分 -->
        <v-card-text v-if="showVoteSection" class="pt-1 pb-1">
          <!-- Display vote summary for all users (logged in or not) -->
          <div class="vote-summary mb-2">
            {{ voteSummary }}
          </div>

          <v-expansion-panels v-if="isLoggedIn">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <template v-slot:default="{ expanded }">
                  {{ $t("app.pages.timeline.vote.title") }}
                  <v-fade-transition leave-absolute>
                    <!-- <span
                      v-if="!expanded"
                      class="text-caption text-grey-darken-1"
                    >
                      {{ voteSummary }}
                    </span> -->
                  </v-fade-transition>
                </template>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-if="loadingTags" class="text-center">
                  <v-progress-circular
                    indeterminate
                    color="accent"
                  ></v-progress-circular>
                </div>
                <div v-else-if="tagsData.all_categories?.length">
                  <v-alert
                    v-if="voteError"
                    type="error"
                    density="compact"
                    class="mb-2"
                  >
                    {{ voteError }}
                  </v-alert>
                  <div
                    v-for="category in sortedCategories"
                    :key="category.category_id"
                    class="mb-4"
                  >
                    <div class="text-subtitle-2 mb-2">{{ category.name }}</div>
                    <v-chip-group :value="userVotes[category.category_id]">
                      <v-chip
                        v-for="option in category.options"
                        :key="option.option_id"
                        :value="option.option_id"
                        variant="outlined"
                        @click="
                          handleChipClick(
                            category.category_id,
                            option.option_id
                          )
                        "
                        :class="{
                          'active-vote':
                            userVotes[category.category_id] ===
                            option.option_id,
                        }"
                      >
                        {{ option.label }} ({{ option.vote_count }})
                      </v-chip>
                    </v-chip-group>
                  </div>
                </div>
                <div v-else class="text-center text-caption">
                  {{ $t("app.pages.timeline.vote.no_tags") }}
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          <div v-else class="text-center text-caption">
            {{ $t("app.pages.timeline.vote.login_required") }}
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn
            v-if="activity.game_id"
            color="accent"
            @click="openGameLaunchDialog"
            prepend-icon="mdi-television-play"
          >
            {{ $t("app.pages.timeline.launch_game") }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="accent" @click="dialog = false">
            {{ $t("app.common.close") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 游戏启动弹窗组件 -->
    <GameLaunchDialog v-model="gameLaunchDialog" :game-id="currentGameId" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { i18n } from "@/i18n";
import { useI18n } from "vue-i18n";
import { formatActivityTitle } from "@/utils/activityTitleFormatter";
import StorageManager from "@/utils/StorageManager";
import axios from "axios";
import GameLaunchDialog from "@/components/GameLaunchDialog.vue";

// 常量
const PIXELS_PER_DAY = 36;
const SECONDS_PER_DAY = 24 * 60 * 60;
const PIXELS_PER_SECOND = PIXELS_PER_DAY / SECONDS_PER_DAY;

// Props
const props = defineProps({
  activity: Object,
  startDate: Date,
  endDate: Date,
  activityStatus: {
    type: String,
    default: "",
  },
  onStatusChange: {
    type: Function,
    required: true,
  },
});

// Emits
const emit = defineEmits(["update:activityStatus"]);

// Refs
const dialog = ref(false);
const gameColor = ref("#888888");
const now = ref(new Date());
const timer = ref(null);
const statusActivatorRef = ref(null);
const showStatusPanel = ref(false);
const loadingTags = ref(false);
const voteError = ref("");
const isRequestInProgress = ref(false);

// 游戏启动相关
const gameLaunchDialog = ref(false);
const currentGameId = ref("");

// 数据
const tagsData = ref({
  all_categories: [],
  user_votes: null,
});
const userVotes = ref({});
const previousVotes = ref({});

// Composables
const { d: $d } = useI18n();

// 计算属性 - 登录状态
const isLoggedIn = computed(() => !!StorageManager.get("auth_token"));

// 计算属性 - 时间相关
const useLocalTimezone = computed(() => {
  return StorageManager.get("useLocalTimezone") === "true";
});

const serverTimezoneOffset = computed(() => {
  const savedTimezone = StorageManager.get("serverTimezone") || "UTC+8";
  const match = savedTimezone.match(/UTC([+-])(\d+)/);
  if (!match) return 8;
  return (match[1] === "+" ? 1 : -1) * parseInt(match[2], 10);
});

const activityStart = computed(() => {
  const start = new Date(props.activity.start_time);
  return adjustActivityTime(start);
});

const activityEnd = computed(() => {
  const end = new Date(props.activity.end_time);
  return adjustActivityTime(end);
});

const adjustedTimestamp = computed(() => {
  const currentTime = now.value;
  
  if (useLocalTimezone.value) {
    // 启用本地时区：直接使用当前时间
    return currentTime.getTime();
  } else {
    // 未启用本地时区：将本地时间转换为UTC+0时间，然后加上服务器时区偏移
    const localOffset = currentTime.getTimezoneOffset() * 60000; // 本地时区偏移（毫秒）
    const utc0Time = currentTime.getTime() + localOffset; // UTC+0时间
    
    const serverOffset = serverTimezoneOffset.value * 3600000; // 服务器时区偏移（毫秒）
    return utc0Time + serverOffset;
  }
});

const adjustedNow = computed(() => new Date(adjustedTimestamp.value));

const isFuture = computed(() => adjustedNow.value < activityStart.value);
const isOngoing = computed(
  () =>
    adjustedNow.value >= activityStart.value &&
    adjustedNow.value < activityEnd.value
);
const isEnded = computed(() => adjustedNow.value >= activityEnd.value);

const timeRemaining = computed(() => {
  if (isEnded.value) return 0;

  // 使用 adjustActivityTime 调整活动时间
  const start = activityStart.value;
  const end = activityEnd.value;
  const current = adjustedNow.value;

  // 添加日志以调试时间计算
//   console.log('timeRemaining Debug:', {
//     currentTime: current.toLocaleString(),
//     activityStart: start.toLocaleString(),
//     activityEnd: end.toLocaleString(),
//     isFuture: isFuture.value,
//     isOngoing: isOngoing.value,
//     isEnded: isEnded.value,
//     timeDiffToStart: start - current,
//     timeDiffToEnd: end - current,
//   });
// debugger
  if (isFuture.value) {
    // 未开始：计算当前时间到开始时间的秒数
    return Math.max(0, Math.floor((start - current) / 1000));
  } else if (isOngoing.value) {
    // 进行中：计算当前时间到结束时间的秒数
    return Math.max(0, Math.floor((end - current) / 1000));
  }
  return 0;
});

const showLeftIndicator = computed(() => isFuture.value && !isEnded.value);
const showRightIndicator = computed(() => isOngoing.value && !isEnded.value);

// 计算属性 - 样式相关
const position = computed(() => {
  const start = activityStart.value;
  const timelineStart = new Date(props.startDate);
  const eventStartOffset = (start - timelineStart) / 1000;
  return `${eventStartOffset * PIXELS_PER_SECOND}px`;
});

const width = computed(() => {
  const start = activityStart.value;
  const end = activityEnd.value;
  const durationMs = end - start;
  const pxWidth = (durationMs / 1000) * PIXELS_PER_SECOND;
  return `${Math.max(pxWidth, 50)}px`;
});

const activityStyle = computed(() => ({
  left: position.value,
  width: width.value,
  backgroundColor: gameColor.value,
  "--color": gameColor.value,
}));

const bannerStyle = computed(() => ({
  objectPosition: getObjectPosition(props.activity),
}));

const leftIndicatorStyle = computed(() => ({
  left: `calc(${position.value} - ${getTextWidth(
    formattedTimeRemaining.value
  )}px - 19px)`,
}));

const rightIndicatorStyle = computed(() => ({
  left: `calc(${position.value} + ${width.value} + 5px)`,
}));

const timeIndicatorClass = computed(() => {
  if (isEnded.value) return "";

  const endDate = new Date(activityEnd.value);
  endDate.setHours(0, 0, 0, 0);

  const today = new Date(adjustedNow.value);
  today.setHours(0, 0, 0, 0);

  const daysRemaining = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));

  if (daysRemaining === 0) return "urgent";
  else if (daysRemaining === 1) return "urgent";
  else if (daysRemaining <= 3) return "warning";
  return "";
});

// 计算属性 - 文本格式化
const formattedTimeRemaining = computed(() =>
  formatRemainingTime(timeRemaining.value, isFuture.value)
);
const detailedTimeRemaining = computed(() =>
  formatDetailedRemainingTime(timeRemaining.value)
);
const dialogTimeRemainingText = computed(() =>
  getDialogTimeText(isEnded.value, isFuture.value, detailedTimeRemaining.value)
);
const formattedTitle = computed(() => formatActivityTitle(props.activity));
const statusIcon = computed(() => {
  switch (props.activityStatus) {
    case "done":
      return "✅";
    case "in_progress":
      return "⏩";
    case "starred":
      return "⭐";
    case "cancelled":
      return "❌";
    default:
      return "⬜";
  }
});

// 计算属性 - 投票相关
const sortedCategories = computed(() => {
  if (!tagsData.value.all_categories) return [];

  return tagsData.value.all_categories.map((category) => {
    const sortedOptions = [...category.options].sort(
      (a, b) => b.vote_count - a.vote_count
    );
    return {
      ...category,
      options: sortedOptions,
    };
  });
});

const voteSummary = computed(() => {
  if (!tagsData.value.all_categories?.length) {
    return i18n.global.t("app.pages.timeline.vote.no_tags");
  }

  return tagsData.value.all_categories
    .map((category) => {
      if (!category.options?.length) return "";

      // 找到票数最高的选项
      const topOption = [...category.options].sort(
        (a, b) => b.vote_count - a.vote_count
      )[0];

      // 如果最高票数为0，显示"无"或"none"
      if (topOption.vote_count === 0) {
        return `${category.name}: ${i18n.global.t(
          "app.pages.timeline.vote.none"
        )}`;
      }

      return `${category.name}: ${topOption.label} (${topOption.vote_count})`;
    })
    .filter(Boolean)
    .join("; ");
});

const showVoteSection = computed(() => {
  return props.activity.type === "event";
});

// 方法 - 时间处理
function getServerTimezone() {
  const savedTimezone = StorageManager.get("serverTimezone") || "UTC+8";
  return savedTimezone;
}

function adjustActivityTime(date) {
  const utc8Offset = 8 * 3600000; // UTC+8 的偏移量（毫秒）
  const serverTimezone = getServerTimezone();
  let targetOffset;

  // 根据服务器时区设置目标偏移量
  if (serverTimezone.includes("UTC+1")) {
    targetOffset = 1 * 3600000; // 欧洲服 UTC+1
  } else if (serverTimezone.includes("UTC-5")) {
    targetOffset = -5 * 3600000; // 美洲服 UTC-5
  } else {
    targetOffset = 8 * 3600000; // 默认 UTC+8（亚服）
  }

  // 判断是否为活动1（type 为 version）或活动2（is_version_update 为 true）的开始时间
  const isActivity1 = props.activity.type === "version";
  const isActivity2Start =
    props.activity.is_version_update &&
    date.getTime() === new Date(props.activity.start_time).getTime();

  if (isActivity1 || isActivity2Start) {
    // 对于活动1的开始和结束时间，或活动2的开始时间：
    // 先计算服务器时区相对于 UTC+8 的偏差，再根据是否使用本地时区调整
    if (useLocalTimezone.value) {
      const localOffset = date.getTimezoneOffset() * 60000; // 本地时区偏移量
      // 从 UTC+8 到服务器时区 (UTC+1)：-8h + 1h = -7h
      // 从服务器时区到本地时区 (UTC+3)：需要 +2h (3h - 1h)
      const localToServerOffset = (-localOffset - targetOffset); // (UTC+3 - UTC+1) = 3h - 1h
      return new Date(date.getTime() - utc8Offset + targetOffset + localToServerOffset);
    } else {
      return new Date(date.getTime() - utc8Offset + targetOffset);
    }
  } else {
    // 对于活动2的结束时间和活动3的开始/结束时间：
    // 假设时间已经是服务器时区（UTC+1），直接转换为本地时区（UTC+3）
    if (useLocalTimezone.value) {
      const localOffset = date.getTimezoneOffset() * 60000; // 本地时区偏移量
      const serverToLocalOffset = (-localOffset - targetOffset); // 服务器时区到本地时区的偏移量（+2h for UTC+3）
      return new Date(date.getTime() + serverToLocalOffset);
    } else {
      return new Date(date.getTime());
    }
  }
}

function formatRemainingTime(seconds, isFuture) {
  if (!seconds) return "";

  const t = i18n.global.t;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const prefix = isFuture
    ? t("app.pages.timeline.starts_in_prefix")
    : t("app.pages.timeline.ends_in_prefix");

  if (days > 0) {
    return (
      prefix +
      t("app.pages.timeline.time_remaining.days_hours", { days, hours })
    );
  } else if (hours > 0) {
    return (
      prefix +
      t("app.pages.timeline.time_remaining.hours_minutes", { hours, minutes })
    );
  } else if (minutes > 0) {
    return prefix + t("app.pages.timeline.time_remaining.minutes", { minutes });
  }
  return prefix + t("app.pages.timeline.time_remaining.less_than_minute");
}

function formatDetailedRemainingTime(seconds) {
  if (!seconds) return "";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const format = (num) => num.toString().padStart(2, "0");

  return days > 0
    ? `${days}${i18n.global.t("app.pages.timeline.day")} ${format(
        hours
      )}:${format(minutes)}:${format(secs)}`
    : `${format(hours)}:${format(minutes)}:${format(secs)}`;
}

function getDialogTimeText(isEnded, isFuture, timeText) {
  if (isEnded) return i18n.global.t("app.pages.timeline.event_ended");
  const prefix = isFuture
    ? i18n.global.t("app.pages.timeline.starts_in")
    : i18n.global.t("app.pages.timeline.ends_in");
  return `${prefix}: ${timeText}`;
}

function formatDate(dateString) {
  const date = adjustActivityTime(new Date(dateString));
  const hour12 = StorageManager.get("timeline-time-format") === "12";
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  };
  return $d(date, options);
}

// 方法 - UI相关
function getTextWidth(text, font = "16px sans-serif") {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;
  return context.measureText(text).width;
}

function getGameColor() {
  try {
    const savedSelections = StorageManager.get("userGameSelections");
    const gameList = StorageManager.get("gameList");
    if (savedSelections && gameList) {
      const { games: selectedGames } = savedSelections;
      const games = gameList;
      const game = games.find((g) => g.game_id === props.activity.game_id);
      if (game?.color) gameColor.value = game.color;
    }
  } catch (error) {
    console.error("Failed to load game color:", error);
  }
}

function getObjectPosition(activity) {
  if (activity.type === "gacha") {
    if (activity.game_id === "genshin") return "center -10px";
    if (activity.game_id === "starrail") return "3px -6px";
    if (activity.game_id === "zenless") return "center -20px";
    return activity.title.includes("武器") ? "center center" : "center 8%";
  } else if (activity.game_id === "starrail") {
    if (activity.type === "version") return "3px -10px";
    return "3px center";
  }
  return "center";
}

// 方法 - 状态管理
function setStatus(status) {
  props.onStatusChange(props.activity.uuid, status);
  showStatusPanel.value = false;
}

// 方法 - 投票相关
async function fetchActivityTags() {
  if (!props.activity?.uuid || props.activity.type !== "event") {
    return;
  }
  loadingTags.value = true;
  voteError.value = "";
  try {
    const token = StorageManager.get("auth_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.get(`/api/tags/${props.activity.uuid}`, {
      headers,
      params: {
        lang: i18n.global.locale.value,
        game_id: props.activity.game_id,
      },
    });

    if (response.data.code === 200) {
      tagsData.value = response.data.data;
      userVotes.value = tagsData.value.user_votes || {};
      previousVotes.value = JSON.parse(JSON.stringify(userVotes.value));
    } else {
      throw new Error(response.data.message || "Failed to fetch tags");
    }
  } catch (error) {
    console.error("Failed to fetch activity tags:", error);
    voteError.value = i18n.global.t("app.pages.timeline.vote.fetch_error");
  } finally {
    loadingTags.value = false;
  }
}

async function submitVote(categoryId, optionId) {
  if (isRequestInProgress.value) return;
  isRequestInProgress.value = true;

  const token = StorageManager.get("auth_token");
  if (!token) {
    voteError.value = i18n.global.t("app.pages.timeline.vote.login_required");
    isRequestInProgress.value = false;
    return;
  }

  try {
    const response = await axios.post(
      "/api/tags/vote",
      {
        activity_uuid: props.activity.uuid,
        game_id: props.activity.game_id,
        votes: {
          [categoryId]: optionId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.message || "投票失败");
    }

    return true;
  } catch (error) {
    console.error("投票失败:", error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      voteError.value = i18n.global.t("app.pages.timeline.vote.login_required");
    } else {
      voteError.value =
        error.message || i18n.global.t("app.pages.timeline.vote.failed");
    }

    return false;
  } finally {
    isRequestInProgress.value = false;
  }
}

async function cancelVote(categoryId) {
  if (!isLoggedIn.value) return false;

  voteError.value = "";

  try {
    const token = StorageManager.get("auth_token");
    if (!token) {
      voteError.value = i18n.global.t("app.pages.timeline.vote.login_required");
      return false;
    }

    const response = await axios.delete("/api/tags/vote", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        activity_uuid: props.activity.uuid,
        game_id: props.activity.game_id,
        category_ids: [categoryId],
      },
    });

    if (response.data.code === 200) {
      return true;
    } else {
      throw new Error(response.data.message || "取消投票失败");
    }
  } catch (error) {
    console.error("取消投票失败:", error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      voteError.value = i18n.global.t("app.pages.timeline.vote.login_required");
    } else {
      voteError.value =
        error.message || i18n.global.t("app.pages.timeline.vote.cancel_failed");
    }
    return false;
  }
}

function handleChipClick(categoryId, optionId) {
  // 如果点击的是当前已选中的选项，则取消投票
  if (userVotes.value[categoryId] === optionId) {
    handleVoteChange(categoryId, undefined); // 传入undefined表示取消投票
  } else {
    handleVoteChange(categoryId, optionId); // 正常投票或更改投票
  }
}

async function handleVoteChange(categoryId, newOptionId) {
  if (!isLoggedIn.value) return;

  voteError.value = "";
  const oldOptionId = previousVotes.value[categoryId];

  console.log("Vote change:", {
    categoryId,
    oldOptionId,
    newOptionId,
    isSame: oldOptionId === newOptionId,
    userVotes: userVotes.value,
    previousVotes: previousVotes.value,
  });

  // 取消投票的情况
  if (newOptionId === undefined) {
    const success = await cancelVote(categoryId);
    if (success) {
      // 更新UI
      const category = tagsData.value.all_categories?.find(
        (c) => c.category_id === categoryId
      );
      if (category && oldOptionId) {
        const option = category.options.find(
          (o) => o.option_id === oldOptionId
        );
        if (option && typeof option.vote_count === "number") {
          option.vote_count = Math.max(0, option.vote_count - 1);
        }
      }

      // 更新状态
      userVotes.value = {
        ...userVotes.value,
        [categoryId]: undefined,
      };
      previousVotes.value = {
        ...previousVotes.value,
        [categoryId]: undefined,
      };
    }
    return;
  }

  // 原有投票逻辑...
  try {
    const originalState = {
      tagsData: JSON.parse(JSON.stringify(tagsData.value)),
      userVotes: JSON.parse(JSON.stringify(userVotes.value)),
      previousVotes: JSON.parse(JSON.stringify(previousVotes.value)),
    };

    // 乐观UI更新
    const category = tagsData.value.all_categories?.find(
      (c) => c.category_id === categoryId
    );

    if (category) {
      // 减少旧选项计数（如果存在且不是新选项）
      if (oldOptionId && oldOptionId !== newOptionId) {
        const oldOption = category.options.find(
          (o) => o.option_id === oldOptionId
        );
        if (oldOption && typeof oldOption.vote_count === "number") {
          oldOption.vote_count = Math.max(0, oldOption.vote_count - 1);
        }
      }

      // 增加新选项计数
      const newOption = category.options.find(
        (o) => o.option_id === newOptionId
      );
      if (newOption) {
        newOption.vote_count = (newOption.vote_count || 0) + 1;
      }
    }

    // 更新用户选择
    userVotes.value = {
      ...userVotes.value,
      [categoryId]: newOptionId,
    };

    // 提交到服务器
    const success = await submitVote(categoryId, newOptionId);

    if (success) {
      // 仅在服务器成功后更新previousVotes
      previousVotes.value = {
        ...previousVotes.value,
        [categoryId]: newOptionId,
      };
    } else {
      // 回滚所有修改
      tagsData.value = originalState.tagsData;
      userVotes.value = originalState.userVotes;
    }
  } catch (error) {
    console.error("投票处理错误:", error);
    voteError.value =
      error.message || i18n.global.t("app.pages.timeline.vote.failed");
  }
}

// 方法 - 游戏启动
function openGameLaunchDialog() {
  if (!props.activity?.game_id) return;
  currentGameId.value = props.activity.game_id;
  gameLaunchDialog.value = true;
}

// 方法 - 生命周期
function startTimer() {
  if (timer.value) clearInterval(timer.value);
  timer.value = setInterval(() => {
    now.value = new Date();
  }, 100);
}

// 添加这些变量
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const DRAG_THRESHOLD = 5; // 拖动阈值，单位像素

// 修改 openDialog 方法
const openDialog = () => {
  if (isDragging.value) return;
  dialog.value = true;
};

// 添加鼠标事件处理
const handleMouseDown = (e) => {
  isDragging.value = false;
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

const handleMouseMove = (e) => {
  const dx = Math.abs(e.clientX - dragStartX.value);
  const dy = Math.abs(e.clientY - dragStartY.value);

  // 如果移动距离超过阈值，则认为是拖动
  if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
    isDragging.value = true;
  }
};

const handleMouseUp = () => {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);

  // 如果是拖动操作，则重置状态
  if (isDragging.value) {
    setTimeout(() => {
      isDragging.value = false;
    }, 10);
    return;
  }

  // 否则执行原有逻辑
  showStatusPanel.value = false;
};

// 生命周期钩子
onMounted(() => {
  getGameColor();
  startTimer();
});

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value);
});

// 监听器
watch(dialog, (newVal) => {
  if (newVal && showVoteSection.value) {
    fetchActivityTags();
  }
});

defineExpose({
  openDialog,
  formattedTitle,
  formatDate,
  dialogTimeRemainingText,
});
</script>

<style scoped>
.activity-item {
  position: absolute;
  font-size: 13px;
  z-index: 15;
  min-width: 50px;
  height: 32px;
  color: #fff;
  border-radius: 16px;
  padding: 0 24px 0 0;
  cursor: pointer;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 32px;
  vertical-align: middle;
  font-size: 1.1em;
  user-select: none;
  display: flex;
  align-items: center;
}

.time-indicator {
  position: absolute;
  top: 4px;
  z-index: 20;
  font-size: 16px;
  white-space: nowrap;
  color: white;
  padding: 2px 5px;
  border-radius: 12px;
  pointer-events: none;
  line-height: 20px;
  background: #0005;
}

.v-theme--dark .time-indicator {
  background: #fff2;
}

.activity-banner {
  position: absolute;
  right: 0;
  top: 0;
  height: 32px;
  width: 150px;
  max-width: 50%;
  background-color: rgba(255, 255, 255, 0.6);
  object-fit: cover;
  z-index: 14;
  pointer-events: none;
  border-radius: 0 16px 16px 0;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 70%);
  mask-image: linear-gradient(to right, transparent 0%, black 70%);
}

.dialog-timer {
  font-weight: bold;
  text-align: center;
  padding: 8px !important;
  border-radius: 4px;
  margin-top: 10px;
  background-color: #eee;
}

.v-theme--dark .dialog-timer {
  background-color: #333;
}

.v-card-title,
.v-card-subtitle {
  white-space: normal;
}

.status-icon {
  font-size: 16px;
  user-select: none;
  cursor: pointer;
  width: 24px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 25;
}

.status-panel div {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
}

.status-panel div:hover {
  background-color: #f0f0f0;
}

.v-theme--dark .status-panel {
  background: #333;
  border-color: #666;
}

.v-theme--dark .status-panel div:hover {
  background-color: #555;
}

.sticky-container {
  position: sticky;
  left: 0;
  z-index: 30;
  border-radius: 16px 0 0 16px;
  min-width: 50px;
  padding-left: 8px;
}

.activity-content {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  position: relative;
}

.activity-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: calc(100%);
  display: inline-block;
  text-shadow: var(--color) -1px -1px 4px, var(--color) 1px -1px 4px,
    var(--color) -1px 1px 4px, var(--color) 1px 1px 4px, var(--color) 0 0 10px;
  padding-left: 4px;
}

.time-indicator.urgent {
  background: #ff5252 !important;
  color: white !important;
}

.time-indicator.warning {
  background: #ff9800 !important;
  color: white !important;
}

.v-theme--dark .time-indicator.urgent {
  background: #d32f2f !important;
}

.v-theme--dark .time-indicator.warning {
  background: #f57c00 !important;
}

.vote-summary {
  font-size: 0.95em;
  color: #666;
  margin-bottom: 8px;
  padding: 4px;
  /* background-color: #f5f5f5; */
  border-radius: 4px;
}

.v-theme--dark .vote-summary {
  color: #aaa;
  background-color: #333;
}

.active-vote {
  background-color: rgba(var(--v-theme-accent), 0.3) !important;
  border-color: rgb(var(--v-theme-accent)) !important;
}

.server-section {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.v-theme--dark .server-section {
  border-bottom-color: #444;
}

.v-theme--dark .activity-item {
  --color-darkened: color-mix(in srgb, var(--color) 70%, #000);
  background-color: var(--color-darkened) !important;
}

.v-theme--dark .activity-title {
  text-shadow: var(--color-darkened) -1px -1px 4px,
    var(--color-darkened) 1px -1px 4px, var(--color-darkened) -1px 1px 4px,
    var(--color-darkened) 1px 1px 4px, var(--color-darkened) 0 0 10px;
}
</style>