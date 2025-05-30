<template>
  <v-card class="timeline-root" :loading="loading ? 'accent' : false">
    <v-card-title class="timeline-header-container">
      <span>{{ $t("app.pages.timeline.title") }}</span>
      <v-switch
        v-model="use24HourFormat"
        :label="
          use24HourFormat
            ? $t('app.timeFormat.24hour')
            : $t('app.timeFormat.12hour')
        "
        @change="saveTimeFormatPreference"
        hide-details
        density="comfortable"
        color="accent"
        class="time-format-switch"
      ></v-switch>
      <!-- 加载状态 -->
    </v-card-title>
    <v-card-text
      ref="cardTextRef"
      @wheel="handleWheelScroll"
      @mousedown="handleMouseDown"
      @mouseleave="handleMouseLeave"
      :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
    >
      <!-- 错误提示 -->
      <v-alert v-if="error" type="error" class="ma-4">
        {{ error }}
      </v-alert>
      <!-- <v-alert
        v-else-if="loading"
        type="info"
        class="ma-4"
        color="accent"
        icon="mdi-reload"
      >
        {{ $t("app.pages.timeline.loading") }}
      </v-alert> -->
      <v-alert
        v-else-if="!loading && activities.length === 0"
        type="info"
        class="ma-4"
        color="accent"
      >
        {{ $t("app.pages.timeline.noActivities") }}
      </v-alert>
      <!-- 时间轴容器 -->
      <div
        class="timeline-scroll-container"
        v-if="!error && !loading && activities.length !== 0"
      >
        <!-- Sticky头部容器 -->
        <div class="sticky-header-container">
          <!-- 月份行 -->
          <div class="timeline-header months-header">
            <div
              v-for="(month, index) in months"
              :key="'month-' + index"
              class="month-cell"
              :style="{
                width: `${month.days * 36}px`,
              }"
            >
              {{
                new Date(2025, month.month - 1, 1).toLocaleDateString(
                  $i18n.locale,
                  { month: "long" }
                )
              }}
            </div>
          </div>

          <!-- 日期行 -->
          <div class="timeline-header">
            <div v-for="day in days" :key="day.date.getTime()" class="day-cell">
              {{ day.date.getDate() }}
            </div>
          </div>

          <!-- 星期行 -->
          <div class="timeline-header">
            <div
              v-for="day in days"
              :key="'weekday-' + day.date.getTime()"
              class="weekday-cell"
            >
              {{ formatWeekday(day.date) }}
            </div>
          </div>

          <!-- 时间行 -->
          <div class="timeline-time-header">
            <div
              v-for="day in days"
              :key="'time-' + day.date.getTime()"
              class="time-cell"
              :class="{ 'current-day': isCurrentDay(day.date) }"
            >
              <template v-if="isCurrentDay(day.date)">
                <span class="time-cell-text">{{ formattedTime }}</span>
              </template>
            </div>
          </div>
        </div>

        <!-- 时间轴主体 -->
        <div class="timeline-body">
          <!-- 时间刻度层 (背景) -->
          <div class="timeline-grid-layer">
            <div
              v-for="day in days"
              :key="'line-' + day.date.getTime()"
              class="timeline-day"
              :class="{ weekend: day.isWeekend }"
            >
              <div class="timeline-line"></div>
              <!-- <div
                v-if="isCurrentDay(day.date)"
                class="current-time-indicator"
                :style="{ left: `${getCurrentTimePosition()}px` }"
              ></div> -->
            </div>
          </div>

          <!-- 活动项层 (前景) -->
          <div class="activity-layer">
            <ActivityItem
              v-for="activity in activities"
              :key="activity.uuid"
              :activity="activity"
              :start-date="startDate"
              :end-date="endDate"
              class="activity-item-row"
            />
            <div
              class="current-time-indicator"
              :style="{ left: `${getCurrentTimePosition()}px` }"
            ></div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useI18n } from "vue-i18n";
import axios from "axios";
import ActivityItem from "@/components/ActivityItem.vue";

const PIXELS_PER_DAY = 36;
const SECONDS_PER_DAY = 24 * 60 * 60;
const PIXELS_PER_SECOND = PIXELS_PER_DAY / SECONDS_PER_DAY;
const SECONDS_PER_PIXEL = 1 / PIXELS_PER_SECOND;

const { d: $d, locale } = useI18n();

// 加载状态和错误处理
const loading = ref(false);
const error = ref(null);

// 活动数据
const activities = ref([]);

// 时间格式切换
const use24HourFormat = ref(
  localStorage.getItem("timeline-time-format") !== "12"
);

const saveTimeFormatPreference = () => {
  localStorage.setItem(
    "timeline-time-format",
    use24HourFormat.value ? "24" : "12"
  );
};

// 当前时间
const currentTime = ref(new Date());
let timeInterval;

// 时间范围
const startDate = ref(new Date());
const endDate = ref(new Date());

// 获取用户选择的游戏和活动类型
const getUserSelections = () => {
  const savedSelections = localStorage.getItem("userGameSelections");
  if (!savedSelections) return { games: [], activities: {} };

  try {
    return JSON.parse(savedSelections);
  } catch {
    return { games: [], activities: {} };
  }
};

// 从API获取公告数据
const fetchAnnouncements = async () => {
  loading.value = true;
  error.value = null;

  try {
    const selections = getUserSelections();
    if (selections.games.length === 0) {
      activities.value = [];
      return;
    }

    // 构建请求参数
    const params = {
      lang: locale.value,
      games: selections.games.join("."),
    };

    // 添加活动类型参数
    selections.games.forEach((gameId) => {
      const activityTypes = selections.activities[gameId];
      if (activityTypes && activityTypes.length > 0) {
        params[`${gameId}_subgroup`] = activityTypes.join(".");
      }
    });

    const response = await axios.get("/api/announcements", { params });

    if (response.data.code === 200) {
      // 提取所有活动并展平数组
      let allActivities = response.data.data.announcements.flatMap((gameAnn) =>
        gameAnn.announcements.map((activity) => ({
          ...activity,
          game_id: gameAnn.game_id,
        }))
      );

      // 获取游戏列表数据
      const gameList = JSON.parse(localStorage.getItem("gameList") || "[]");

      // 排序活动数据
      activities.value = sortActivities(allActivities, gameList);

      // 计算时间范围
      calculateTimeRange();
    } else {
      throw new Error(response.data.message || "Failed to fetch announcements");
    }
  } catch (err) {
    console.error("Error fetching announcements:", err);
    error.value = err.message || "Failed to load timeline data";
  } finally {
    loading.value = false;
  }
  setTimeout(() => {
    scrollToCurrentTime();
  }, 50);
};

// 计算时间范围
const calculateTimeRange = () => {
  if (activities.value.length === 0) {
    // 如果没有活动，默认显示当前月
    const now = new Date();
    startDate.value = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate.value = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return;
  }

  // 找到最早开始时间和最晚结束时间
  let earliestStart = Infinity;
  let latestEnd = -Infinity;

  activities.value.forEach((activity) => {
    const startTime = new Date(activity.start_time).getTime();
    const endTime = new Date(activity.end_time).getTime();

    if (startTime < earliestStart) earliestStart = startTime;
    if (endTime > latestEnd) latestEnd = endTime;
  });

  // 扩展3天范围
  earliestStart -= 0 * 24 * 60 * 60 * 1000;
  latestEnd += 3 * 24 * 60 * 60 * 1000;

  startDate.value = new Date(earliestStart);
  startDate.value.setHours(0, 0, 0, 0);

  endDate.value = new Date(latestEnd);
  endDate.value.setHours(0, 0, 0, 0);
};

// 监听语言变化
watch(locale, () => {
  fetchAnnouncements();
});

onMounted(() => {
  timeInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 100);
  fetchAnnouncements();
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
});

onBeforeUnmount(() => {
  clearInterval(timeInterval);
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
});

const handleWheelScroll = (event) => {
  event.preventDefault();
  event.currentTarget.scrollLeft += event.deltaY;
};

// 格式化当前时间显示
const formattedTime = computed(() => {
  const hours = currentTime.value.getHours();
  const minutes = currentTime.value.getMinutes();
  const seconds = currentTime.value.getSeconds();

  if (use24HourFormat.value) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } else {
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")} ${ampm}`;
  }
});

// 生成时间轴天数数据
const days = computed(() => {
  const result = [];
  const current = new Date(startDate.value);

  while (current <= endDate.value) {
    result.push({
      date: new Date(current),
      isWeekend: current.getDay() === 0 || current.getDay() === 6,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
});

// 计算月份分组
const months = computed(() => {
  const monthMap = new Map();

  days.value.forEach((day) => {
    const monthKey = day.date.getFullYear() + "-" + day.date.getMonth();
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        month: day.date.getMonth() + 1,
        year: day.date.getFullYear(),
        days: 0,
      });
    }
    monthMap.get(monthKey).days++;
  });

  return Array.from(monthMap.values());
});

const formatWeekday = (date) => {
  if (locale.value.startsWith("zh")) {
    const weekdayMap = ["日", "一", "二", "三", "四", "五", "六"];
    return weekdayMap[date.getDay()];
  } else {
    const weekday = $d(date, { weekday: "short" }).replace(".", "");
    if (locale.value.includes("en")) {
      return weekday.slice(0, 2);
    }
    return weekday;
  }
};

// 判断是否是当天
const isCurrentDay = (date) => {
  return (
    date.getDate() === currentTime.value.getDate() &&
    date.getMonth() === currentTime.value.getMonth() &&
    date.getFullYear() === currentTime.value.getFullYear()
  );
};

// 计算当前时间位置
const getCurrentTimePosition = () => {
  const now = currentTime.value;
  const diffSeconds = (now - startDate.value) / 1000;
  return (diffSeconds * PIXELS_PER_SECOND).toFixed(8);
};

const cardTextRef = ref(null);

// 修改后的scrollToCurrentTime方法
const scrollToCurrentTime = () => {
  if (!cardTextRef.value) return;

  const now = new Date();
  const startOfRange = new Date(startDate.value);
  const daysDiff = Math.floor((now - startOfRange) / (1000 * 60 * 60 * 24));
  const hoursDiff = now.getHours() + now.getMinutes() / 60;

  const dayPosition = daysDiff * PIXELS_PER_DAY;
  const timePosition = hoursDiff * (PIXELS_PER_DAY / 24);
  const totalPosition = dayPosition + timePosition;

  const containerWidth = cardTextRef.value.$el.clientWidth;
  const scrollPosition = totalPosition - containerWidth / 2;

  cardTextRef.value.$el.scrollTo({
    left: scrollPosition,
    behavior: "smooth",
  });
};

const sortActivities = (activities, gameList) => {
  // 创建游戏顺序映射表
  const gameOrder = {};
  gameList.forEach((game, index) => {
    gameOrder[game.game_id] = index;
  });

  return [...activities].sort((a, b) => {
    // 1. 首先按照游戏在games数组中的顺序排序
    const gameCompare = gameOrder[a.game_id] - gameOrder[b.game_id];
    if (gameCompare !== 0) return gameCompare;

    // 获取当前游戏的活动类型顺序
    const currentGame = gameList.find((game) => game.game_id === a.game_id);
    if (!currentGame || !currentGame.activities_type_list) return 0;

    const typeOrder = currentGame.activities_type_list;

    // 2. 然后按照activities_type_list中的顺序排序
    const aTypeIndex = typeOrder.indexOf(a.type);
    const bTypeIndex = typeOrder.indexOf(b.type);

    // 如果类型不在列表中，放到最后
    const aTypePos = aTypeIndex === -1 ? Infinity : aTypeIndex;
    const bTypePos = bTypeIndex === -1 ? Infinity : bTypeIndex;

    const typeCompare = aTypePos - bTypePos;
    if (typeCompare !== 0) return typeCompare;

    // 3. 最后按照开始时间升序排序
    return new Date(a.start_time) - new Date(b.start_time);
  });
};

const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const scrollLeft = ref(0);
const scrollTop = ref(0);

const handleMouseDown = (e) => {
  if (e.button !== 0) return; // 只处理左键
  if (!cardTextRef.value) return;

  const container = cardTextRef.value.$el;
  isDragging.value = true;
  startX.value = e.pageX - container.offsetLeft; // 横向仍用 pageX
  startY.value = e.clientY; // 纵向改用 clientY
  scrollLeft.value = container.scrollLeft;
  scrollTop.value = window.scrollY; // 记录窗口当前滚动位置

  e.preventDefault();
  e.stopPropagation();
};

const handleMouseMove = (e) => {
  if (!isDragging.value || !cardTextRef.value) return;

  const container = cardTextRef.value.$el;

  // 横向滚动（保持不变）
  const x = e.pageX - container.offsetLeft;
  const walkX = x - startX.value;
  container.scrollLeft = scrollLeft.value - walkX;

  // 纵向滚动（改用 clientY）
  const walkY = e.clientY - startY.value;
  window.scrollTo({
    top: scrollTop.value - walkY,
    behavior: "auto",
  });

  // 防止默认行为（避免页面意外滚动）
  e.preventDefault();
};

const handleMouseUp = (e) => {
  if (e.button !== 0) return; // Only left button
  isDragging.value = false;
};

const handleMouseLeave = () => {
  isDragging.value = false;
};
</script>

<style scoped>
/* 保持原有样式不变 */
.timeline-root {
  background-color: #fff8;
}

.v-theme--dark .timeline-root {
  background-color: #4448;
}

.v-card-text {
  padding: 0;
  overflow: auto;
}

.timeline-scroll-container {
  position: relative;
  min-width: max-content;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.sticky-header-container {
  position: sticky;
  top: 0;
  background: inherit;
  z-index: 2;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.timeline-header {
  display: flex;
  height: 24px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  font-size: 14px;
  font-weight: 500;
  min-width: max-content;
}

.timeline-time-header {
  display: flex;
  height: 24px;
  font-size: 14px;
  font-weight: 500;
  min-width: max-content;
}

.months-header {
  position: sticky;
  left: 0;
  z-index: 3;
}

.month-cell {
  display: flex;
  align-items: center;
  padding-left: 12px;
  border-left: 1px solid #eee;
  white-space: nowrap;
  text-align: left;
  font-weight: bold;
  background-color: inherit;
  flex-shrink: 0;
  position: sticky;
  left: 0px;
}

.sticky-month {
  position: sticky;
  left: 0;
  z-index: 3;
}

.day-cell {
  min-width: 36px;
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.weekday-cell {
  min-width: 36px;
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e0e0e0;
  text-transform: capitalize;
  flex-shrink: 0;
}

.time-cell {
  min-width: 36px;
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
  overflow: visible;
}

.time-cell.current-day {
  color: rgb(var(--v-theme-warning));
  font-weight: bold;
}

.time-cell-text {
  white-space: nowrap;
}

.timeline-body {
  display: flex;
  /* min-height: 400px; */
  min-height: 60vh;
  min-width: max-content;
  position: relative;
  /* overflow: hidden; */
}

/* 时间刻度层 - 作为背景 */
.timeline-grid-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 0; /* 确保在背景层 */
}

/* 活动项层 - 作为前景 */
.activity-layer {
  position: relative;
  z-index: 1; /* 确保在时间刻度上方 */
  padding-top: 8px; /* 与原始样式保持一致 */
  min-height: 100%; /* 撑满容器 */
}

.timeline-day {
  min-width: 36px;
  width: 36px;
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
}

.timeline-line {
  flex: 1;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 36px;
  width: 1px;
  background-color: #e0e0e0;
}

.timeline-day.weekend {
  background-color: rgba(0, 0, 0, 0.02);
}

.current-time-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: rgb(var(--v-theme-warning));
  z-index: 20;
}

.current-time-indicator::before {
  content: "";
  position: absolute;
  top: 0;
  left: -3px;
  width: 8px;
  height: 8px;
  background-color: rgb(var(--v-theme-warning));
  border-radius: 50%;
}

.current-time-indicator::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: -3px;
  width: 8px;
  height: 8px;
  background-color: rgb(var(--v-theme-warning));
  border-radius: 50%;
}

.activity-item-row {
  height: 32px;
  margin-bottom: 8px;
  position: relative;
}

/* 暗色主题适配 */
.v-theme--dark .timeline-header {
  background-color: #424242;
  border-bottom-color: #616161;
}

.v-theme--dark .timeline-line {
  background-color: #616161;
}

.v-theme--dark .timeline-day.weekend {
  background-color: rgba(255, 255, 255, 0.02);
}

.v-theme--dark .month-cell {
  border-right-color: #616161;
}

.v-theme--dark .time-cell.current-day {
  color: rgb(var(--v-theme-accent));
}

.v-theme--dark .current-time-indicator {
  background-color: rgb(var(--v-theme-accent));
}

.v-theme--dark .current-time-indicator::before,
.v-theme--dark .current-time-indicator::after {
  background-color: rgb(var(--v-theme-accent));
}

/* 滚动条样式 */
.timeline-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.timeline-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.timeline-scroll-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.v-theme--dark .timeline-scroll-container::-webkit-scrollbar-track {
  background: #424242;
}

.v-theme--dark .timeline-scroll-container::-webkit-scrollbar-thumb {
  background: #616161;
}

.timeline-header-container {
  top: 4px;
  position: relative;
}

.time-format-switch {
  float: right;
  margin-top: -9px;
}

.loading-bar {
  width: 100%;
}
</style>