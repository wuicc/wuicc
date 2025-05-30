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
        <v-card-title>{{ formattedTitle }}</v-card-title>
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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { i18n } from "@/i18n";
import { useI18n } from "vue-i18n";

const PIXELS_PER_DAY = 36; // 每天36px
const SECONDS_PER_DAY = 24 * 60 * 60; // 每天86400秒
const PIXELS_PER_SECOND = PIXELS_PER_DAY / SECONDS_PER_DAY; // 0.000416667px/秒
const SECONDS_PER_PIXEL = 1 / PIXELS_PER_SECOND; // 2400秒/px (40分钟)

const props = defineProps({
  activity: Object,
  startDate: Date,
  endDate: Date,
});

const { d: $d } = useI18n();

const formatDate = (dateString) => {
  const date = new Date(dateString);
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

const use24HourFormat = computed(() => {
  return localStorage.getItem("timeline-time-format") !== "12";
});

// 从本地存储获取游戏信息
const gameColor = ref("#888888"); // 默认颜色

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

function getGachaName(activity) {
  try {
    const gameList = JSON.parse(localStorage.getItem("gameList"));
    if (!gameList) return "";

    const game = gameList.find((g) => g.game_id === activity.game_id);
    if (!game || !game.activities || !game.activities.gacha) return "";

    // 获取当前语言设置
    const language = localStorage.getItem("userLanguage");

    // 返回对应语言的祈愿名称
    return game.activities.gacha.name[language] || "";
  } catch (error) {
    console.error("Failed to get gacha name:", error);
    return "";
  }
}

onMounted(() => {
  getGameColor();
  startTimer();
});

// 定时器相关
const now = ref(new Date());
let timer = null;

const startTimer = () => {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
};

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const dialog = ref(false);
const openDialog = () => {
  dialog.value = true;
};

// 活动时间计算
const activityStart = computed(() => new Date(props.activity.start_time));
const activityEnd = computed(() => new Date(props.activity.end_time));

const isFuture = computed(() => now.value < activityStart.value);
const isOngoing = computed(
  () => now.value >= activityStart.value && now.value < activityEnd.value
);
const isEnded = computed(() => now.value >= activityEnd.value);

const showLeftIndicator = computed(() => isFuture.value && !isEnded.value);
const showRightIndicator = computed(() => isOngoing.value && !isEnded.value);

// 计算剩余时间（秒）
const timeRemaining = computed(() => {
  if (isFuture.value) {
    return Math.floor((activityStart.value - now.value) / 1000);
  } else if (isOngoing.value) {
    return Math.floor((activityEnd.value - now.value) / 1000);
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

// 位置计算
const position = computed(() => {
  const start = new Date(props.activity.start_time);
  const timelineStart = new Date(props.startDate);
  const eventStartOffset = (start.getTime() - timelineStart.getTime()) / 1000;
  return `${eventStartOffset * PIXELS_PER_SECOND}px`;
});

const width = computed(() => {
  const start = new Date(props.activity.start_time);
  const end = new Date(props.activity.end_time);
  const durationMs = end - start;
  const pxWidth = (durationMs / 1000) * PIXELS_PER_SECOND;
  return `${Math.max(pxWidth, 50)}px`; // 设置最小宽度为50px
});

// 倒计时指示器位置
const leftIndicatorStyle = computed(() => {
  const leftPos = parseFloat(position.value);
  const textWidth = getTextWidth(
    formattedTimeRemaining.value,
    "16px sans-serif"
  );

  return {
    left: `${leftPos - textWidth - 19}px`, // 居中
  };
});

const rightIndicatorStyle = computed(() => {
  const leftPos = parseFloat(position.value);
  const widthVal = parseFloat(width.value);
  return {
    left: `${leftPos + widthVal + 5}px`,
  };
});

function getTextWidth(text, font = "16px sans-serif") {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;
  return context.measureText(text).width;
}

// const formatDate = (str) => {
//   return new Date(str).toLocaleString();
// };

const activityStyle = computed(() => {
  return {
    left: position.value,
    width: width.value,
    height: "32px",
    backgroundColor: gameColor.value,
    color: "#fff",
    borderRadius: "16px",
    padding: "0 24px 0 0 ", // 增加左右padding
    cursor: "pointer",
    // overflow: "hidden",
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
  };
});

const bannerStyle = computed(() => {
  return {
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
  };
});

const formattedTitle = computed(() => {
  const language = localStorage.getItem("userLanguage");
  if (props.activity.type === "version") {
    return formatVersionActivity(props.activity);
  }
  if (props.activity.type === "event") {
    if (language.startsWith("en")) {
      if (props.activity.title.includes(":")) {
        const title = extractTitle(props.activity.title);
        let lastColonIndex = title.lastIndexOf(":");
        let result = title.substring(0, lastColonIndex);
        return result;
      }
    }
    return extractTitle(props.activity.title);
  } else if (props.activity.type === "gacha" && language !== "zh-Hans") {
    console.log(props.activity);
    return `${getGachaName(props.activity)} - ${extractTitle(
      props.activity.title
    )}`;
  }
  return props.activity.title;
});

function formatVersionActivity(activity) {
  const versionNumber = activity.title.match(/(\d\.\d)/)[0];
  const gameName = i18n.global.t(`app.games.${activity.game_id}.title`);
  return `${gameName} ${formatGameVersion(versionNumber)}`;
}

function formatGameVersion(version) {
  return i18n.global.t(`app.version_with_number`, { version });
}

function extractTitle(title) {
  // 尝试匹配中文括号或方括号中的内容
  const cjkRegex = /[「\[]([^「\]」]+)[」\]]/;
  const cjkMatch = cjkRegex.exec(title);

  if (cjkMatch) {
    return cjkMatch[1];
  }

  // 如果没有找到中文括号内容，尝试匹配英文双引号中的内容
  const quoteRegex = /"([^"]+)"/;
  const quoteMatch = quoteRegex.exec(title);

  if (quoteMatch) {
    return quoteMatch[1];
  }

  // 如果都没有找到，返回原标题
  return title;
}

const detailedTimeRemaining = computed(() => {
  if (isEnded.value) return "";

  const seconds = timeRemaining.value;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // 格式化数字为两位数
  const format = (num) => num.toString().padStart(2, "0");

  if (days > 0) {
    return `${days}${i18n.global.t("app.pages.timeline.day")} ${format(
      hours
    )}:${format(minutes)}:${format(secs)}`;
  }
  return `${format(hours)}:${format(minutes)}:${format(secs)}`;
});

// 修改后的弹窗倒计时文本
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
</script>

<style scoped>
.activity-item {
  position: absolute;
  font-size: 13px;
  z-index: 15;
  transition: background-color 0.3s ease;
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
</style>