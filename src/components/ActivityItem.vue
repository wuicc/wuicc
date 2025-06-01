<template>
  <div>
    <!-- 活动块 -->
    <div class="activity-item" :style="activityStyle" @click="openDialog">
      <div class="activity-content">
        <span class="activity-title">{{ formattedTitle }}</span>
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
      :style="rightIndicatorStyle"
    >
      {{ formattedTimeRemaining }}
    </div>

    <!-- 活动详情弹窗 -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-img
          :src="activity.banner_img"
          height="200px"
          cover
          referrerpolicy="no-referrer"
        ></v-img>
        <v-card-title>{{
          activity.type === "event" ? activity.title : formattedTitle
        }}</v-card-title>
        <v-card-subtitle>
          {{ formatDate(activity.start_time) }} -
          {{ formatDate(activity.end_time) }}
        </v-card-subtitle>

        <!-- 弹窗内的倒计时 -->
        <v-card-text v-if="dialogTimeRemainingText" class="dialog-timer">
          {{ dialogTimeRemainingText }}
        </v-card-text>

        <v-card-actions>
          <v-btn color="accent" @click="dialog = false">{{
            $t("app.close")
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { i18n } from "@/i18n";
import { useI18n } from "vue-i18n";

const PIXELS_PER_DAY = 36;
const SECONDS_PER_DAY = 24 * 60 * 60;
const PIXELS_PER_SECOND = PIXELS_PER_DAY / SECONDS_PER_DAY;

const props = defineProps({
  activity: Object,
  startDate: Date,
  endDate: Date,
});

const { d: $d } = useI18n();
const dialog = ref(false);
const gameColor = ref("#888888");

// 定时器相关
const now = ref(new Date());
let timer = null;

// 从本地存储加载时区设置
const useLocalTimezone = computed(() => {
  const saved = localStorage.getItem("useLocalTimezone");
  return saved === "true";
});

// 获取服务器时区偏移量（小时）
const getServerTimezoneOffset = () => {
  const savedTimezone = localStorage.getItem("serverTimezone") || "UTC+8";
  const match = savedTimezone.match(/UTC([+-])(\d+)/);
  if (!match) return 8; // 默认 UTC+8

  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2], 10);
  return sign * hours;
};

// 获取时区调整后的时间
const getAdjustedTime = (date) => {
  if (!useLocalTimezone.value) return new Date(date);

  const serverOffsetHours = getServerTimezoneOffset();
  const serverOffset = serverOffsetHours * 60 * 60 * 1000; // 转换为毫秒
  const localOffset = date.getTimezoneOffset() * 60 * 1000;
  // console.log((localOffset + serverOffset)/1000);
  return new Date(date.getTime() - (localOffset + serverOffset));
};

// 获取时区调整后的当前时间
const getAdjustedCurrentTime = () => {
  return getAdjustedTime(new Date());
};

const startTimer = () => {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    now.value = getAdjustedCurrentTime();
  }, 10000);
};

// 活动位置计算 - 不使用时区调整（保持位置不变）
const position = computed(() => {
  const start = getAdjustedTime(new Date(props.activity.start_time));
  const timelineStart = new Date(props.startDate);
  const eventStartOffset = (start - timelineStart) / 1000;
  return `${eventStartOffset * PIXELS_PER_SECOND}px`;
});

// 活动宽度计算 - 不使用时区调整（保持位置不变）
const width = computed(() => {
  const start = new Date(props.activity.start_time);
  const end = new Date(props.activity.end_time);
  const durationMs = end - start;
  const pxWidth = (durationMs / 1000) * PIXELS_PER_SECOND;
  return `${Math.max(pxWidth, 50)}px`;
});

// 活动时间状态计算 - 使用时区调整后的时间
const activityStart = computed(() =>
  getAdjustedTime(new Date(props.activity.start_time))
);

const activityEnd = computed(() =>
  getAdjustedTime(new Date(props.activity.end_time))
);

const isFuture = computed(() => now.value < activityStart.value);
const isOngoing = computed(
  () => now.value >= activityStart.value && now.value < activityEnd.value
);
const isEnded = computed(() => now.value >= activityEnd.value);

const showLeftIndicator = computed(() => isFuture.value && !isEnded.value);
const showRightIndicator = computed(() => isOngoing.value && !isEnded.value);

// 计算剩余时间（秒）
const timeRemaining = computed(() => {
  if (isEnded.value) return 0;

  // 获取当前时间（根据时区设置调整）
  const currentTime = useLocalTimezone.value
    ? getAdjustedCurrentTime()
    : new Date();
  let offset = 0;
  const serverOffsetHours = getServerTimezoneOffset();
  const serverOffset = serverOffsetHours * 60 * 60 * 1000; // 转换为毫秒
  const localOffset = currentTime.getTimezoneOffset() * 60 * 1000;
  offset = serverOffset + localOffset;
  if (isFuture.value) {
    return Math.floor((activityStart.value - currentTime - offset) / 1000);
  } else if (isOngoing.value) {
    return Math.floor((activityEnd.value - currentTime - offset) / 1000);
  }
  return 0;
});

// 格式化剩余时间
const formattedTimeRemaining = computed(() => {
  if (isEnded.value) return "";

  const seconds = timeRemaining.value;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const t = i18n.global.t;
  const prefix = isFuture.value
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
  } else {
    return prefix + t("app.pages.timeline.time_remaining.less_than_minute");
  }
});

// 倒计时显示位置计算
const leftIndicatorStyle = computed(() => ({
  left: `calc(${position.value} - ${getTextWidth(
    formattedTimeRemaining.value
  )}px - 19px)`,
}));

const rightIndicatorStyle = computed(() => ({
  left: `calc(${position.value} + ${width.value} + 5px)`,
}));

// 获取文本宽度
function getTextWidth(text, font = "16px sans-serif") {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;
  return context.measureText(text).width;
}

// 活动样式
const activityStyle = computed(() => ({
  left: position.value,
  width: width.value,
  height: "32px",
  backgroundColor: gameColor.value,
  color: "#fff",
  borderRadius: "16px",
  padding: "0 24px 0 0",
  cursor: "pointer",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  lineHeight: "32px",
  verticalAlign: "middle",
  fontSize: "1.1em",
  userSelect: "none",
  position: "absolute",
  display: "flex",
  alignItems: "center",
  "--color": gameColor.value,
}));

// Banner样式
const bannerStyle = computed(() => ({
  position: "absolute",
  right: "0",
  top: "0",
  height: "32px",
  width: "150px",
  maxWidth: "50%",
  backgroundColor: "rgba(255, 255, 255, 0.6)",
  objectFit: "cover",
  zIndex: 14,
  objectPosition: getObjectPosition(props.activity),
  pointerEvents: "none",
}));

// 获取游戏颜色
const getGameColor = () => {
  try {
    const savedSelections = localStorage.getItem("userGameSelections");
    const gameList = localStorage.getItem("gameList");

    if (savedSelections && gameList) {
      const { games: selectedGames } = JSON.parse(savedSelections);
      const games = JSON.parse(gameList);

      const game = games.find((g) => g.game_id === props.activity.game_id);
      if (game && game.color) {
        gameColor.value = game.color;
      }
    }
  } catch (error) {
    console.error("Failed to load game color:", error);
  }
};

// 格式化日期 - 使用时区调整后的时间
const formatDate = (dateString) => {
  const date = getAdjustedTime(new Date(dateString));
  const hour12 = localStorage.getItem("timeline-time-format") === "12";
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: hour12,
  };

  return $d(date, options);
};

// 活动标题格式化
import { formatActivityTitle } from "@/utils/activityTitleFormatter";

// 替换原来的 formattedTitle computed 属性
const formattedTitle = computed(() => formatActivityTitle(props.activity));

// 详细倒计时文本
const detailedTimeRemaining = computed(() => {
  if (isEnded.value) return "";

  const seconds = timeRemaining.value;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const format = (num) => num.toString().padStart(2, "0");

  if (days > 0) {
    return `${days}${i18n.global.t("app.pages.timeline.day")} ${format(
      hours
    )}:${format(minutes)}:${format(secs)}`;
  }
  return `${format(hours)}:${format(minutes)}:${format(secs)}`;
});

// 弹窗倒计时文本
const dialogTimeRemainingText = computed(() => {
  if (isEnded.value) return i18n.global.t("app.pages.timeline.event_ended");

  if (isFuture.value) {
    return (
      i18n.global.t("app.pages.timeline.starts_in") +
      ": " +
      detailedTimeRemaining.value
    );
  } else if (isOngoing.value) {
    return (
      i18n.global.t("app.pages.timeline.ends_in") +
      ": " +
      detailedTimeRemaining.value
    );
  }
  return "";
});

// 获取Banner图片位置
function getObjectPosition(activity) {
  if (activity.type === "gacha") {
    if (activity.game_id === "genshin") {
      return "center -10px";
    } else if (activity.game_id === "starrail") {
      return "3px -10px";
    } else if (activity.game_id === "zenless") {
      return "center -20px";
    } else {
      return activity.title.includes("武器") ? "center center" : "center 8%";
    }
  } else if (activity.game_id === "starrail") {
    return "3px center";
  } else {
    return "center";
  }
}

// 打开弹窗
const openDialog = () => {
  dialog.value = true;
};

onMounted(() => {
  getGameColor();
  startTimer();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
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
  /* transition: background-color 0.3s ease; */
  min-width: 50px;
}

.activity-content {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  left: 16px;
}

.activity-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: sticky;
  z-index: 20;
  max-width: calc(100% - 32px);
  display: inline-block;
  left: 16px;
  text-shadow: var(--color) -1px -1px 4px, var(--color) 1px -1px 4px,
    var(--color) -1px 1px 4px, var(--color) 1px 1px 4px, var(--color) 0 0 10px;
}

.time-indicator {
  position: absolute;
  top: 4px;
  z-index: 20;
  font-size: 16px;
  white-space: nowrap;
  background: #0005;
  color: white;
  padding: 2px 5px;
  border-radius: 12px;
  pointer-events: none;
  line-height: 20px;
}

.dialog-timer {
  font-weight: bold;
  text-align: center;
  padding: 8px !important;
  background-color: #eee;
  border-radius: 4px;
  margin-top: 10px;
}

.v-theme--dark .dialog-timer {
  background-color: #333;
}

.v-theme--dark .time-indicator {
  background: #fff2;
}

.activity-banner {
  height: 32px;
  min-width: 50px;
  background-color: rgba(255, 255, 255, 0.6);
  object-fit: cover;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 70%);
  mask-image: linear-gradient(to right, transparent 0%, black 70%);
  flex-shrink: 0;
  border-radius: 0px 16px 16px 0px;
}

.v-card-title,
.v-card-subtitle {
  white-space: normal;
}
</style>