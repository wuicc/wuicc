<template>
  <v-card class="timeline-root" :loading="loading ? 'accent' : false">
    <v-card-title class="timeline-header-container">
      <span>{{ $t("app.pages.timeline.title") }}</span>
      <div class="time-controls">
        <v-chip class="timezone-chip" color="accent" variant="outlined">
          <v-icon left>mdi-server</v-icon>&nbsp;
          {{ displayedServerTimezone }}&nbsp;
          <template v-if="shouldShowLocalTimezone">
            <v-icon right>mdi-arrow-right</v-icon>&nbsp;
            <v-icon left>mdi-account</v-icon>&nbsp;
            {{ localTimezone }}
          </template>
        </v-chip>
      </div>
    </v-card-title>
    <v-card-text
      ref="cardTextRef"
      @wheel="handleWheelScroll"
      @mousedown="handleMouseDown"
      @mouseleave="handleMouseLeave"
      :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
    >
      <v-alert v-if="error" type="error" class="ma-4">
        {{ error }}
      </v-alert>
      <v-alert
        v-else-if="!loading && activities.length === 0"
        type="info"
        class="ma-4"
        color="accent"
      >
        {{ $t("app.pages.timeline.noActivities") }}
      </v-alert>
      <div
        class="timeline-scroll-container"
        v-if="!error && !loading && activities.length !== 0"
      >
        <div class="sticky-header-container">
          <div class="timeline-header months-header">
            <div
              v-for="(month, index) in months"
              :key="'month-' + index"
              class="month-cell"
              :style="{
                width: `${month.days * 36 + 1.15}px`,
              }"
            >
              <div class="month-label">
                {{ formatMonth(month.month - 1, month.year) }}
              </div>
            </div>
          </div>

          <div class="timeline-header">
            <div
              v-for="day in days"
              :key="day.date.getTime()"
              class="day-cell"
              @click="showDayPanel(day.date)"
            >
              {{ day.date.getDate() }}
            </div>
          </div>

          <div class="timeline-header">
            <div
              v-for="day in days"
              :key="'weekday-' + day.date.getTime()"
              class="weekday-cell"
              @click="showDayPanel(day.date)"
            >
              {{ formatWeekday(day.date) }}
            </div>
          </div>

          <div class="timeline-time-header">
            <div class="time-header-arrow-container">
              <div class="left-section" :style="{ width: leftSectionWidth }">
                <div
                  class="arrow-indicator right-arrow"
                  v-if="showRightArrow"
                  @click="scrollToCurrentTime"
                >
                  ▶
                </div>
              </div>
              <div class="right-section" :style="{ width: rightSectionWidth }">
                <div
                  class="arrow-indicator left-arrow"
                  v-if="showLeftArrow"
                  @click="scrollToCurrentTime"
                >
                  ◀
                </div>
              </div>
            </div>
            <div
              class="current-time-display"
              :style="{ left: `${currentTimePosition + 0.5}px` }"
            >
              {{ formattedTime }}
            </div>
          </div>
        </div>

        <div class="timeline-body">
          <div class="timeline-grid-layer">
            <div
              v-for="day in days"
              :key="'line-' + day.date.getTime()"
              class="timeline-day"
              :class="{ weekend: day.isWeekend }"
            >
              <div class="timeline-line"></div>
            </div>
          </div>

          <div class="activity-layer">
            <ActivityItem
              v-for="activity in activities"
              :key="activity.uuid"
              :activity="activity"
              :start-date="startDate"
              :end-date="endDate"
              :server-timezone-offset="8"
              :use-local-display="true"
              class="activity-item-row"
            />
            <div
              class="current-time-indicator"
              :style="{ left: `${getCurrentTimePosition() - 1}px` }"
            ></div>
          </div>
        </div>
      </div>
    </v-card-text>
    <transition name="day-panel">
      <div v-if="selectedDay" class="day-panel-backdrop" @click="hideDayPanel">
        <div class="day-panel" @click.stop>
          <div class="day-panel-header">
            <div class="day-panel-date">
              <span class="font-weight-bold">{{
                formatFullDate(selectedDay)
              }}</span>
              <span class="day-panel-days-away ml-2">
                {{ getDaysAwayText(selectedDay) }}
              </span>
            </div>
          </div>
          <div class="day-panel-activities">
            <div
              v-for="activity in getActivitiesForDay(selectedDay)"
              :key="activity.uuid"
              class="day-panel-activity"
              :style="{
                'background-color': getGameColor(activity.game_id) + '33',
                'border-left': `4px solid ${getGameColor(activity.game_id)}`,
              }"
              @click="hideDayPanel"
            >
              <div class="activity-game">
                {{ getGameName(activity.game_id) }}
              </div>
              <div class="activity-title">
                {{ formattedTitle(activity) }}
              </div>
            </div>
            <div
              v-if="getActivitiesForDay(selectedDay).length === 0"
              class="day-panel-no-activities"
            >
              {{ $t("app.pages.timeline.noActivitiesForDay") }}
            </div>
          </div>
        </div>
      </div>
    </transition>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useI18n } from "vue-i18n";
import { i18n } from "@/i18n";
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

// 当前时间
const currentTime = ref(new Date());
let timeInterval;

// 时间范围
const startDate = ref(new Date());
const endDate = ref(new Date());

// 时区相关状态
const serverTimezone = ref("UTC+8");
const useLocalTimezone = ref(false);

// 从本地存储加载设置
const loadTimezoneSettings = () => {
  const savedTimezone = localStorage.getItem("serverTimezone");
  if (savedTimezone) {
    serverTimezone.value = savedTimezone;
  }

  const savedDisplayMode = localStorage.getItem("useLocalTimezone");
  if (savedDisplayMode) {
    useLocalTimezone.value = savedDisplayMode === "true";
  }
};

// 计算本地时区
const localTimezone = computed(() => {
  const offset = -new Date().getTimezoneOffset() / 60;
  return `UTC${offset >= 0 ? "+" : ""}${offset}`;
});

// 是否显示本地时区
const shouldShowLocalTimezone = computed(() => {
  return useLocalTimezone.value;
});

// 显示的服务器时区格式
const displayedServerTimezone = computed(() => {
  return serverTimezone.value;
});

const getAdjustedCurrentTime = () => {
  const now = new Date();

  if (!useLocalTimezone.value) {
    // 使用服务器时区 (UTC+8)
    const serverOffset = getServerTimezoneOffset() * 60 * 60 * 1000;
    const localOffset = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() + localOffset + serverOffset);
  }

  return now; // 使用本地时区
};

const getServerTimezoneOffset = () => {
  const match = serverTimezone.value.match(/UTC([+-])(\d+)/);
  if (!match) return 8; // 默认 UTC+8

  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2], 10);
  return sign * hours;
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

    const params = {
      lang: locale.value,
      games: selections.games.join("."),
    };

    selections.games.forEach((gameId) => {
      const activityTypes = selections.activities[gameId];
      if (activityTypes && activityTypes.length > 0) {
        params[`${gameId}_subgroup`] = activityTypes.join(".");
      }
    });

    const response = await axios.get("/api/announcements", { params });

    if (response.data.code === 200) {
      let allActivities = response.data.data.announcements.flatMap((gameAnn) =>
        gameAnn.announcements.map((activity) => ({
          ...activity,
          game_id: gameAnn.game_id,
        }))
      );

      const gameList = JSON.parse(localStorage.getItem("gameList") || "[]");
      activities.value = sortActivities(allActivities, gameList);
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
    const now = new Date();
    startDate.value = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate.value = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return;
  }

  let earliestStart = Infinity;
  let latestEnd = -Infinity;

  activities.value.forEach((activity) => {
    const startTime = new Date(activity.start_time).getTime();
    const endTime = new Date(activity.end_time).getTime();

    if (startTime < earliestStart) earliestStart = startTime;
    if (endTime > latestEnd) latestEnd = endTime;
  });

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

// 监听本地存储变化
watch(
  () => [
    localStorage.getItem("serverTimezone"),
    localStorage.getItem("useLocalTimezone"),
  ],
  () => {
    loadTimezoneSettings();
  }
);

onMounted(() => {
  loadTimezoneSettings();
  timeInterval = setInterval(() => {
    currentTime.value = getAdjustedCurrentTime();
  }, 100);
  fetchAnnouncements();
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);

  if (cardTextRef.value) {
    cardTextRef.value.$el.addEventListener("scroll", handleScroll);
    containerWidth.value = cardTextRef.value.$el.clientWidth;
  }

  window.addEventListener("resize", () => {
    if (cardTextRef.value) {
      containerWidth.value = cardTextRef.value.$el.clientWidth;
      updateArrowVisibility();
    }
  });

  // 添加存储事件监听
  window.addEventListener("storage", loadTimezoneSettings);
});

onBeforeUnmount(() => {
  clearInterval(timeInterval);
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);

  if (cardTextRef.value) {
    cardTextRef.value.$el.removeEventListener("scroll", handleScroll);
  }
  window.removeEventListener("resize", updateArrowVisibility);
  window.removeEventListener("storage", loadTimezoneSettings);
});

// 时间轴位置计算相关
const currentTimePosition = ref(0);
const containerScrollLeft = ref(0);
const containerWidth = ref(0);
const showLeftArrow = ref(false);
const showRightArrow = ref(false);
const cardTextRef = ref(null);

const leftSectionWidth = computed(() => {
  return `${currentTimePosition.value}px`;
});

const rightSectionWidth = computed(() => {
  return `calc(100% - ${currentTimePosition.value}px)`;
});

const updateArrowVisibility = () => {
  if (!cardTextRef.value) return;

  const container = cardTextRef.value.$el;
  const timePos = currentTimePosition.value;
  const scrollLeft = container.scrollLeft;
  const scrollRight = scrollLeft + container.clientWidth;

  showLeftArrow.value = timePos + 30 < scrollLeft;
  showRightArrow.value = timePos - 30 > scrollRight;
};

const getCurrentTimePosition = () => {
  const now = currentTime.value;
  const diffSeconds = (now - startDate.value) / 1000;
  const pos = diffSeconds * PIXELS_PER_SECOND - 0.5;
  currentTimePosition.value = pos;
  updateArrowVisibility();
  return pos;
};

const handleScroll = () => {
  if (!cardTextRef.value) return;
  containerScrollLeft.value = cardTextRef.value.$el.scrollLeft;
  updateArrowVisibility();
};

const handleWheelScroll = (event) => {
  event.preventDefault();
  event.currentTarget.scrollLeft += event.deltaY;
};

// 格式化当前时间显示
const formattedTime = computed(() => {
  const time = currentTime.value;
  const use24Hour = localStorage.getItem("timeline-time-format") !== "12";
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  if (use24Hour) {
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
    const date = new Date(current);
    result.push({
      date,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
});

// 计算月份分组
const months = computed(() => {
  const monthMap = new Map();
  const current = new Date(startDate.value);

  while (current <= endDate.value) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const key = `${year}-${month}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, {
        month: month + 1,
        year,
        days: 0,
      });
    }
    monthMap.get(key).days++;
    current.setDate(current.getDate() + 1);
  }

  const monthsArray = Array.from(monthMap.values());
  let offset = 0;
  monthsArray.forEach((month) => {
    month.offset = offset;
    offset += month.days * PIXELS_PER_DAY;
  });

  return monthsArray;
});

const formatMonth = (month, year) => {
  return new Date(year, month, 1).toLocaleDateString(locale.value, {
    month: "long",
  });
};

const formatWeekday = (date) => {
  if (locale.value.startsWith("zh")) {
    const weekdayMap = ["日", "一", "二", "三", "四", "五", "六"];
    return weekdayMap[date.getDay()];
  } else {
    const weekday = $d(date, { weekday: "short" }).replace(".", "");
    if (
      locale.value.includes("en") ||
      locale.value.includes("fr") ||
      locale.value.includes("es")
    ) {
      return weekday.slice(0, 2);
    }
    return weekday;
  }
};

const scrollToCurrentTime = () => {
  if (!cardTextRef.value) return;

  const now = currentTime.value;
  const startOfRange = startDate.value;
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

const sortActivities = (activities, gameList) => {
  const gameOrder = {};
  gameList.forEach((game, index) => {
    gameOrder[game.game_id] = index;
  });

  return [...activities].sort((a, b) => {
    const gameCompare = gameOrder[a.game_id] - gameOrder[b.game_id];
    if (gameCompare !== 0) return gameCompare;

    const currentGame = gameList.find((game) => game.game_id === a.game_id);
    if (!currentGame || !currentGame.activities_type_list) return 0;

    const typeOrder = currentGame.activities_type_list;
    const aTypeIndex = typeOrder.indexOf(a.type);
    const bTypeIndex = typeOrder.indexOf(b.type);

    const aTypePos = aTypeIndex === -1 ? Infinity : aTypeIndex;
    const bTypePos = bTypeIndex === -1 ? Infinity : bTypeIndex;

    const typeCompare = aTypePos - bTypePos;
    if (typeCompare !== 0) return typeCompare;

    return new Date(a.start_time) - new Date(b.start_time);
  });
};

// 拖拽滚动逻辑
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const scrollLeft = ref(0);
const scrollTop = ref(0);

const handleMouseDown = (e) => {
  if (e.button !== 0) return;
  if (!cardTextRef.value) return;

  const container = cardTextRef.value.$el;
  isDragging.value = true;
  startX.value = e.pageX - container.offsetLeft;
  startY.value = e.pageY - container.offsetTop;
  scrollLeft.value = container.scrollLeft;
  scrollTop.value = container.scrollTop;

  e.preventDefault();
  e.stopPropagation();
};

const handleMouseMove = (e) => {
  if (!isDragging.value || !cardTextRef.value) return;

  const container = cardTextRef.value.$el;
  const x = e.pageX - container.offsetLeft;
  const y = e.pageY - container.offsetTop;
  const walkX = x - startX.value;
  const walkY = y - startY.value;

  container.scrollLeft = scrollLeft.value - walkX;
  container.scrollTop = scrollTop.value - walkY;

  e.preventDefault();
};

const handleMouseUp = (e) => {
  if (e.button !== 0) return;
  isDragging.value = false;
};

const handleMouseLeave = () => {
  isDragging.value = false;
};

// 日期面板相关
const selectedDay = ref(null);
const gameList = ref(JSON.parse(localStorage.getItem("gameList") || "[]"));

const showDayPanel = (date) => {
  selectedDay.value = new Date(date);
  selectedDay.value.setHours(0, 0, 0, 0);
};

const hideDayPanel = () => {
  selectedDay.value = null;
};

const getActivitiesForDay = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return activities.value.filter((activity) => {
    const startTime = new Date(activity.start_time);
    const endTime = new Date(activity.end_time);
    return startTime <= endOfDay && endTime >= startOfDay;
  });
};

const formatFullDate = (date) => {
  return $d(date, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
};

const getDaysAwayText = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = date - today;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return i18n.global.t("app.pages.timeline.today");
  } else if (diffDays === 1) {
    return i18n.global.t("app.pages.timeline.tomorrow");
  } else if (diffDays === -1) {
    return i18n.global.t("app.pages.timeline.yesterday");
  } else if (diffDays > 0) {
    return i18n.global.t("app.pages.timeline.daysLater", { count: diffDays });
  } else {
    return i18n.global.t("app.pages.timeline.daysAgo", {
      count: Math.abs(diffDays),
    });
  }
};

const getGameName = (gameId) => {
  const game = gameList.value.find((g) => g.game_id === gameId);
  return game ? game.game_name : "";
};

const formatActivityTime = (activity) => {
  const start = new Date(activity.start_time);
  const end = new Date(activity.end_time);

  const startStr = $d(start, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24HourFormat.value,
  });

  const endStr = $d(end, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24HourFormat.value,
  });

  return `${startStr} - ${endStr}`;
};

// 活动标题格式化
import { formatActivityTitle } from "@/utils/activityTitleFormatter";

const formattedTitle = (activity) => formatActivityTitle(activity);

const getGameColor = (gameId) => {
  try {
    const savedSelections = localStorage.getItem("userGameSelections");
    const gameList = JSON.parse(localStorage.getItem("gameList") || "[]");

    if (savedSelections && gameList) {
      const game = gameList.find((g) => g.game_id === gameId);
      if (game && game.color) {
        return game.color;
      }
    }
    return "#607D8B";
  } catch (error) {
    console.error("Failed to load game color:", error);
    return "#607D8B";
  }
};
</script>

<style scoped>
/* 基础样式 */
.timeline-root {
  background-color: #fff8;
}

.v-theme--dark .timeline-root {
  background-color: #4448;
}

.v-card-text {
  padding: 0;
  overflow: auto;
  max-height: calc(100vh - 150px);
}

/* 时间轴容器 */
.timeline-scroll-container {
  position: relative;
  min-width: max-content;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fff8;
}

.v-theme--dark .timeline-scroll-container {
  border-color: #616161;
  background-color: #424242;
}

/* 时间轴头部 */
.sticky-header-container {
  position: sticky;
  top: 0;
  margin-top: -2px;
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

.v-theme--dark .timeline-header {
  background-color: #424242;
  border-bottom-color: #616161;
}

/* 月份头部 */
.months-header {
  position: sticky;
  left: 0;
  z-index: 3;
}

.month-cell {
  display: flex;
  align-items: center;
  padding-left: 12px;
  border-left: 1px solid #e0e0e0;
  white-space: nowrap;
  text-align: left;
  font-weight: bold;
  background-color: inherit;
  flex-shrink: 0;
  margin-left: -1px;
  border-top: 1px solid #e0e0e0;
}

.month-label {
  position: sticky;
  left: 12px;
  white-space: nowrap;
}

/* 日期单元格 */
.day-cell,
.weekday-cell {
  min-width: 36px;
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.weekday-cell {
  text-transform: capitalize;
}

/* 当前时间显示 */
.timeline-time-header {
  display: flex;
  height: 24px;
  font-size: 14px;
  font-weight: 500;
  min-width: 100%;
  position: relative;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fff;
}

.v-theme--dark .timeline-time-header {
  background-color: #333;
  border-bottom-color: #616161;
}

.current-time-display {
  position: absolute;
  top: 2px;
  transform: translateX(-50%);
  padding: 0 12px;
  color: rgb(var(--v-theme-warning));
  z-index: 1;
  white-space: nowrap;
}

.v-theme--dark .current-time-display {
  color: rgb(var(--v-theme-accent));
}

/* 时间轴主体 */
.timeline-body {
  display: flex;
  /* min-height: 60vh; */
  min-width: max-content;
  position: relative;
}

.timeline-grid-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 0;
}

.activity-layer {
  position: relative;
  z-index: 1;
  padding-top: 8px;
  min-height: 100%;
}

/* 时间轴天 */
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

.v-theme--dark .timeline-line {
  background-color: #616161;
}

.timeline-day.weekend {
  background-color: rgba(0, 0, 0, 0.02);
}

.v-theme--dark .timeline-day.weekend {
  background-color: rgba(255, 255, 255, 0.02);
}

/* 当前时间指示器 */
.current-time-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: rgb(var(--v-theme-warning));
  z-index: 20;
}

.current-time-indicator::before,
.current-time-indicator::after {
  content: "";
  position: absolute;
  left: -3px;
  width: 8px;
  height: 8px;
  background-color: rgb(var(--v-theme-warning));
  border-radius: 50%;
}

.current-time-indicator::before {
  top: 0;
}

.current-time-indicator::after {
  bottom: 0;
}

.v-theme--dark .current-time-indicator {
  background-color: rgb(var(--v-theme-accent));
}

.v-theme--dark .current-time-indicator::before,
.v-theme--dark .current-time-indicator::after {
  background-color: rgb(var(--v-theme-accent));
}

/* 活动项 */
.activity-item-row {
  height: 32px;
  margin-bottom: 8px;
  position: relative;
}

/* 时间控制 */
.time-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  float: right;
}

.timezone-chip {
  font-size: 0.8rem;
  height: 28px;
  top: 1px;
}

/* 滚动条 */
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

/* 时间箭头指示器 */
.time-header-arrow-container {
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.left-section,
.right-section {
  position: relative;
  height: 100%;
}

.arrow-indicator {
  position: sticky;
  height: 100%;
  font-weight: bold;
  color: rgb(var(--v-theme-warning));
  width: 20px;
  margin-top: 1px;
}

.v-theme--dark .arrow-indicator {
  color: rgb(var(--v-theme-accent));
}

.right-arrow {
  right: 0;
  float: right;
}

.left-arrow {
  left: 10px;
}

/* 日期面板样式 */
.day-panel-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 60px;
}

.day-panel {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin-top: 20px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.v-theme--dark .day-panel {
  background-color: #424242;
  color: white;
}

.day-panel-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  background-color: inherit;
  z-index: 1;
  transition: opacity 0.2s ease;
}

.v-theme--dark .day-panel-header {
  border-bottom-color: #616161;
}

.day-panel-date {
  font-size: 1.2rem;
  margin-bottom: -4px;
}

.day-panel-days-away {
  font-size: 0.9rem;
  color: #666;
}

.v-theme--dark .day-panel-days-away {
  color: #aaa;
}

.day-panel-activities {
  padding: 12px 0;
  transition: opacity 0.2s ease;
}

.day-panel-activity {
  padding: 12px 16px;
  margin: 0 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
  transform-origin: top;
}

.day-panel-activity:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.v-theme--dark .day-panel-activity {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.v-theme--dark .day-panel-activity:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.activity-game {
  font-weight: bold;
  margin-bottom: 4px;
  opacity: 0.9;
}

.activity-title {
  opacity: 0.9;
}

.day-panel-no-activities {
  padding: 24px 16px;
  margin: 16px;
  text-align: center;
  color: #666;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.05);
}

.v-theme--dark .day-panel-no-activities {
  color: #aaa;
  background-color: rgba(255, 255, 255, 0.05);
}

/* 面板动画 */
.day-panel-enter-active,
.day-panel-leave-active {
  transition: all 0.3s ease;
}

.day-panel-enter-from,
.day-panel-leave-to {
  opacity: 0;
}

.day-panel-enter-active .day-panel,
.day-panel-leave-active .day-panel {
  transition-delay: 0.1s;
}

.day-panel-enter-from .day-panel,
.day-panel-leave-to .day-panel {
  transform: translateY(-20px);
  opacity: 0;
}

.day-panel-enter-active .day-panel-activity {
  transition-delay: calc(0.1s + var(--delay, 0) * 0.05s);
}

.day-panel-enter-from .day-panel-activity,
.day-panel-leave-to .day-panel-activity {
  transform: scaleY(0.8);
  opacity: 0;
}
</style>