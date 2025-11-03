<template>
  <v-card class="timeline-root" :loading="loading ? 'accent' : false">
    <v-card-title class="timeline-header-container">
      <span>{{ $t("app.pages.timeline.title") }}</span>
      <div class="time-controls">
        <v-menu v-model="timeSortMenuOpen" offset-y :close-on-content-click="false" scrollStrategy="close"
          location="start">
          <template v-slot:activator="{ props: menuProps }">
            <v-icon color="accent" style="font-size: 24px; cursor: pointer;" v-bind="menuProps">
              mdi-clock-time-three-outline
            </v-icon>
          </template>
          <v-card>
            <v-select v-model="sortOption" :items="sortOptions" item-title="title" item-value="value" dense outlined
              hide-details @update:model-value="applySortOption" color="accent">
              <template v-slot:selection="{ item }">
                <div class="d-flex align-center">
                  <span>{{ item ? $t(`app.pages.timeline.${item.value === 'default' ? 'defaultSort' : 'endTimeDesc'}`) :
                    '' }}</span>
                </div>
              </template>
            </v-select>
          </v-card>
        </v-menu>
        <v-chip class="timezone-chip" color="accent" variant="outlined" @click="navigateToSettings">
          <v-icon left>mdi-server</v-icon>
          {{ displayedServerTimezone }}&nbsp;
          <template v-if="shouldShowLocalTimezone">
            <v-icon right>mdi-arrow-right</v-icon>&nbsp;
            <v-icon left>mdi-map-marker</v-icon>
            {{ localTimezone }}
          </template>
        </v-chip>
      </div>
    </v-card-title>
    <v-card-text ref="cardTextRef" @wheel="handleWheelScroll" @mousedown="handleMouseDown"
      @mouseleave="handleMouseLeave" :style="{ cursor: isDragging ? 'grabbing' : 'grab' }">
      <v-alert v-if="error" type="error" class="ma-4">
        {{ error }}
      </v-alert>
      <v-alert v-else-if="!loading && activities.length === 0" type="info" class="ma-4" color="accent">
        {{ $t("app.pages.timeline.noActivities") }}
      </v-alert>
      <div class="timeline-scroll-container" v-if="!error && !loading && activities.length !== 0">
        <div class="sticky-header-container">
          <div class="timeline-header months-header">
            <div v-for="(month, index) in months" :key="'month-' + index" class="month-cell" :style="{
              width: `${month.days * 36 - 0.1}px`,
            }">
              <div class="month-label">
                {{ formatMonth(month.month - 1, month.year) }}
              </div>
            </div>
          </div>

          <div class="day-week-container">
            <div class="day-week-row">
              <div v-for="day in days" :key="day.date.getTime()" class="day-week-cell" :class="{
                weekend: day.isWeekend,
                'current-day': isCurrentDay(day.date),
              }" @click="showDayPanel(day.date)">
                <div class="day-cell">
                  {{ day.date.getDate() }}
                </div>
                <div class="weekday-cell">
                  {{ formatWeekday(day.date) }}
                </div>
              </div>
            </div>
          </div>

          <div class="timeline-time-header">
            <div class="time-header-arrow-container">
              <div class="left-section" :style="{ width: leftSectionWidth }">
                <div class="arrow-indicator right-arrow cursor-pointer" v-if="showRightArrow"
                  @click="scrollToCurrentTime('smooth')">
                  ▶
                </div>
              </div>
              <div class="right-section" :style="{ width: rightSectionWidth }">
                <div class="arrow-indicator left-arrow cursor-pointer" v-if="showLeftArrow"
                  @click="scrollToCurrentTime('smooth')">
                  ◀
                </div>
              </div>
            </div>
            <div class="current-time-display cursor-pointer" :style="{ left: `${currentTimePosition + 0.5}px` }"
              @click="scrollToCurrentTime('smooth')">
              {{ formattedTime }}
            </div>
          </div>
        </div>

        <div class="timeline-body">
          <div class="timeline-grid-layer">
            <div v-for="day in days" :key="'line-' + day.date.getTime()" class="timeline-day"
              :class="{ weekend: day.isWeekend }">
              <div class="timeline-line"></div>
            </div>
          </div>

          <div class="activity-layer">
            <ActivityItem v-for="activity in activities" :key="activity.uuid"
              :ref="(el) => registerActivityItem(activity.uuid, el)" :activity="activity" :start-date="startDate"
              :end-date="endDate" :server-timezone-offset="8" :use-local-display="true"
              :activity-status="activityStatuses[activity.uuid] || ''" :on-status-change="handleStatusChange"
              class="activity-item-row" @vue:unmounted="unregisterActivityItem(activity.uuid)" />
            <div class="current-time-indicator" :style="{ left: `${getCurrentTimePosition() - 1}px` }"></div>
          </div>
        </div>
      </div>
    </v-card-text>
    <transition name="day-panel">
      <div v-if="selectedDay" class="day-panel-backdrop" @click="hideDayPanel">
        <div class="day-panel" @click.stop>
          <div class="day-panel-header">
            <div class="day-panel-date" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
              <div>
                <span class="font-weight-bold">{{
                  formatFullDate(selectedDay)
                  }}</span>
                <span class="day-panel-days-away ml-2">{{
                  getDaysAwayText(selectedDay)
                  }}</span>
              </div>
              <v-btn icon class="day-panel-close-btn" density="comfortable" variant="flat" @click="hideDayPanel">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
          <div class="day-panel-activities">
            <div v-for="activity in getActivitiesForDay(selectedDay)" :key="activity.uuid" class="day-panel-activity"
              :style="{
                'background-color': getGameColor(activity.game_id) + '33',
                'border-left': `4px solid ${getGameColor(activity.game_id)}`,
              }" @click="dayPanelActivityClick(activity)">
              <!-- 添加菜单和状态图标 -->
              <v-menu v-model="statusMenus[activity.uuid]" :close-on-content-click="false" offset-y
                scrollStrategy="close">
                <template v-slot:activator="{ props: menuProps }">
                  <div class="status-icon d-inline mr-1 cursor-pointer" v-bind="menuProps" @click.stop>
                    {{ getActivityStatusIcon(activity.uuid) }}
                  </div>
                </template>

                <v-card width="55px">
                  <v-list density="compact" class="text-center">
                    <v-list-item @click="setActivityStatus(activity.uuid, '')">
                      <v-list-item-title>⬜</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="setActivityStatus(activity.uuid, 'done')">
                      <v-list-item-title>✅</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="setActivityStatus(activity.uuid, 'in_progress')">
                      <v-list-item-title>⏩</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="setActivityStatus(activity.uuid, 'starred')">
                      <v-list-item-title>⭐</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="setActivityStatus(activity.uuid, 'cancelled')">
                      <v-list-item-title>❌</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-menu>

              <div class="activity-title d-inline">
                {{ formattedTitle(activity) }}
              </div>
            </div>
            <div v-if="getActivitiesForDay(selectedDay).length === 0" class="day-panel-no-activities">
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
import StorageManager from "@/utils/StorageManager";
import { useEventsStore } from "@/store/events";
const { d: $d, locale } = useI18n();

// 初始化事件store
const eventsStore = useEventsStore();

import { useRouter } from "vue-router";

const router = useRouter();

const navigateToSettings = () => {
  // 传递参数告诉设置页面需要高亮时区设置
  router.push({ path: '/settings', query: { highlight: 'timezone' } });
};

const timeSortMenuOpen = ref(false);
const sortOption = ref('default');
const sortOptions = computed(() => [
  {
    title: i18n.global.t('app.pages.timeline.defaultSort'),
    value: 'default'
  },
  {
    title: i18n.global.t('app.pages.timeline.endTimeDesc'),
    value: 'endTimeDesc'
  }
]);

const isTimeSorted = ref(false);
const originalActivitiesOrder = ref([]);

const PIXELS_PER_DAY = 36;
const SECONDS_PER_DAY = 24 * 60 * 60;
const PIXELS_PER_SECOND = PIXELS_PER_DAY / SECONDS_PER_DAY;
const SECONDS_PER_PIXEL = 1 / PIXELS_PER_SECOND;

// 用于取消请求的token
let currentRequestCancelToken = null;

// 从store中获取活动数据
const storeActivities = computed(() => eventsStore.activities);
// 本地排序后的活动列表
const activities = ref([]);
const loading = computed(() => eventsStore.loading);
const error = computed(() => eventsStore.error);

// 时间格式切换
const use24HourFormat = ref(
  StorageManager.get("timeline-time-format") !== "12"
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
  const savedTimezone = StorageManager.get("serverTimezone");
  if (savedTimezone) {
    serverTimezone.value = savedTimezone;
  }

  const savedDisplayMode = StorageManager.get("useLocalTimezone");
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
const fetchEvents = async () => {
  eventsStore.setLoading(true);
  eventsStore.setError(null);
  isTimeSorted.value = false;
  originalActivitiesOrder.value = [];

  try {
    // 取消之前的请求
    if (currentRequestCancelToken) {
      currentRequestCancelToken.cancel('Operation canceled by the user.');
    }

    // 创建新的cancel token
    currentRequestCancelToken = axios.CancelToken.source();

    const selections = getUserSelections();
    if (Object.keys(selections).length === 0) {
      eventsStore.setActivities([]);
      return;
    }

    // 获取已启用的游戏
    const enabledGames = Object.keys(selections).filter(
      (gameId) => selections[gameId].enabled
    );

    if (enabledGames.length === 0) {
      eventsStore.setActivities([]);
      return;
    }

    const params = {
      lang: locale.value,
      games: enabledGames.join("."),
    };

    // 添加活动类型参数
    enabledGames.forEach((gameId) => {
      const activityTypes = selections[gameId].activities;
      if (activityTypes && activityTypes.length > 0) {
        params[`${gameId}_subgroup`] = activityTypes.join(".");
      }
    });

    const response = await axios.get("/api/events", {
      params,
      cancelToken: currentRequestCancelToken.token
    });

    if (response.data.code === 200) {
      let allActivities = response.data.data.events.flatMap((gameEvents) =>
        gameEvents.events.map((activity) => ({
          ...activity,
          game_id: gameEvents.game_id,
          title: activity.title ? activity.title.replace(/&amp;/g, '&') : activity.title,
        }))
      );

      // 定义时间限制
      const MIN_DATE = new Date("2025-05-01T00:00:00");
      const MAX_DATE = new Date("2026-06-01T23:59:59");

      // 修正活动时间
      allActivities = allActivities.map((activity) => {
        let startTime = new Date(activity.start_time);
        let endTime = new Date(activity.end_time);

        // 如果开始时间早于最小日期，修正为最小日期
        if (startTime < MIN_DATE) {
          startTime = new Date(MIN_DATE);
        }

        // 如果结束时间晚于最大日期，修正为最大日期
        if (endTime > MAX_DATE) {
          endTime = new Date(MAX_DATE);
        }

        // 确保开始时间不晚于结束时间
        if (startTime > endTime) {
          startTime = new Date(endTime);
        }

        return {
          ...activity,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        };
      });

      const gameList = StorageManager.get("gameList") || [];
      const sortedActivities = sortActivities(allActivities, gameList);
      eventsStore.setActivities(sortedActivities);
      // 确保本地activities.value与store同步
      activities.value = [...sortedActivities];
      calculateTimeRange();
    } else {
      throw new Error(response.data.message || "Failed to fetch events");
    }
  } catch (err) {
    // 忽略取消请求的错误
    if (axios.isCancel(err)) {
      console.log('Request canceled:', err.message);
      return;
    }
    console.error("Error fetching events:", err);
    eventsStore.setError(`Error fetching events: ${err.message}`);
  } finally {
    eventsStore.setLoading(false);
  }
  setTimeout(() => {
    scrollToCurrentTime();
  }, 1);
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

  earliestStart -= 1 * 24 * 60 * 60 * 1000;
  latestEnd += 3 * 24 * 60 * 60 * 1000;

  startDate.value = new Date(earliestStart);
  startDate.value.setHours(0, 0, 0, 0);

  endDate.value = new Date(latestEnd);
  endDate.value.setHours(0, 0, 0, 0);
};

// 监听语言变化
watch(locale, () => {
  fetchEvents().then(() => {
    if (sortOption.value) {
      applySortOption(sortOption.value);
    }
  });
});

// 监听本地存储变化
watch(
  () => [
    StorageManager.get("serverTimezone"),
    StorageManager.get("useLocalTimezone"),
    StorageManager.get("userGameSelections"), // 监听游戏选择变化
  ],
  () => {
    loadTimezoneSettings();
    fetchEvents(); // 当游戏选择变化时重新获取活动
  }
);

// 加载默认游戏顺序
const loadDefaultOrder = () => {
  try {
    const gameList = StorageManager.get("gameList") || [];
    const savedSelections = StorageManager.get("userGameSelections") || {};

    // 获取已启用的游戏并按原始顺序排序
    defaultGameOrder.value = gameList
      .filter((game) => savedSelections[game.game_id]?.enabled)
      .map((game) => game.game_id);
  } catch (error) {
    console.error("加载默认游戏顺序失败:", error);
    defaultGameOrder.value = [];
  }
};

// 恢复默认顺序
const restoreDefaultOrder = () => {
  gameOrder.value = [...defaultGameOrder.value];
  StorageManager.set("gameOrder", gameOrder.value);
  fetchEvents(); // 重新加载活动以应用新排序
};

const timezoneOffset = ref(new Date().getTimezoneOffset());

onMounted(() => {
  loadTimezoneSettings();
  loadDefaultOrder();
  timeInterval = setInterval(() => {
    const now = new Date();
    const currentOffset = now.getTimezoneOffset();

    // 检查时区是否变化
    if (currentOffset !== timezoneOffset.value) {
      timezoneOffset.value = currentOffset;
      // 时区变化时重新加载
      fetchEvents();
      scrollToCurrentTime();
    }

    currentTime.value = getAdjustedCurrentTime();
  }, 100);
  
  // 处理活动数据加载
  if (eventsStore.activities.length === 0) {
    fetchEvents();
  } else {
    // 如果store中已有数据，将其存到变量中
    originalActivitiesOrder.value = [...eventsStore.activities];
    
    // 立即应用排序选项（如果有）
    if (sortOption.value && sortOption.value !== 'default') {
      applySortOption(sortOption.value);
    } else {
      activities.value = [...eventsStore.activities];
    }
    
    // 在activities.value被赋值后再计算时间范围
    calculateTimeRange();
    
    // 使用requestAnimationFrame确保DOM已经准备好
    requestAnimationFrame(() => {
      // 更新当前时间位置
      getCurrentTimePosition();
      
      // 延迟滚动到当前时间，确保DOM已经完全渲染
      setTimeout(() => {
        scrollToCurrentTime();
      }, 10);
    });
  }
  
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

  // 获取当前时间格式设置
  const is12HourFormat = StorageManager.get("timeline-time-format") === "12";

  // 计算额外的判定范围
  const extraRange = is12HourFormat ? 12 : 0;

  showLeftArrow.value = timePos + 30 + extraRange < scrollLeft;
  showRightArrow.value = timePos - 30 - extraRange > scrollRight;
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
  const use24Hour = StorageManager.get("timeline-time-format") !== "12";
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

const isCurrentDay = (date) => {
  const today = currentTime.value;
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

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

const scrollToCurrentTime = (behavior = "instant") => {
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
    behavior: behavior,
  });
};

// 获取用户选择的游戏和活动类型
const getUserSelections = () => {
  const savedSelections = StorageManager.get("userGameSelections");
  if (!savedSelections) return {};

  try {
    return savedSelections;
  } catch {
    return {};
  }
};

const gameOrder = ref(StorageManager.get("gameOrder") || []);
const defaultGameOrder = ref([]);
const isOrderDefault = computed(() => {
  return (
    JSON.stringify(gameOrder.value) === JSON.stringify(defaultGameOrder.value)
  );
});

const sortActivities = (activities, gameList) => {
  // 获取当前游戏顺序
  const currentOrder =
    gameOrder.value.length > 0 ? gameOrder.value : defaultGameOrder.value;

  // 创建游戏顺序映射 {game_id: index}
  const gameOrderMap = new Map(currentOrder.map((id, index) => [id, index]));

  return [...activities].sort((a, b) => {
    // 按游戏顺序排序
    const aOrder = gameOrderMap.has(a.game_id)
      ? gameOrderMap.get(a.game_id)
      : Infinity;
    const bOrder = gameOrderMap.has(b.game_id)
      ? gameOrderMap.get(b.game_id)
      : Infinity;

    if (aOrder !== bOrder) return aOrder - bOrder;

    // 同游戏按活动类型排序
    const currentGame = gameList.find((game) => game.game_id === a.game_id);
    if (!currentGame || !currentGame.activities_type_list) return 0;

    const typeOrder = currentGame.activities_type_list;
    const aTypeIndex = typeOrder.indexOf(a.type);
    const bTypeIndex = typeOrder.indexOf(b.type);

    const aTypePos = aTypeIndex === -1 ? Infinity : aTypeIndex;
    const bTypePos = bTypeIndex === -1 ? Infinity : bTypeIndex;

    const typeCompare = aTypePos - bTypePos;
    if (typeCompare !== 0) return typeCompare;

    // 同类型按时间排序
    return new Date(a.start_time) - new Date(b.start_time);
  });
};

// 应用排序选项
const applySortOption = (option) => {
  if (option === 'default') {
    // 还原原始排序
    if (originalActivitiesOrder.value.length > 0) {
      activities.value = [...originalActivitiesOrder.value];
    } else {
      activities.value = [...storeActivities.value];
    }
    isTimeSorted.value = false;
  } else if (option === 'endTimeDesc') {
    // 保存原始顺序
    if (!isTimeSorted.value && originalActivitiesOrder.value.length === 0) {
      originalActivitiesOrder.value = [...storeActivities.value];
    }
    // 按结束时间排序（升序）
    activities.value = [...storeActivities.value].sort((a, b) => {
      return new Date(a.end_time) - new Date(b.end_time);
    });
    isTimeSorted.value = true;
  }
  timeSortMenuOpen.value = false;
};

// 监听store中的活动变化，更新本地活动列表
watch(storeActivities, (newActivities) => {
  // 当store中的活动更新时，重置排序状态
  isTimeSorted.value = false;
  originalActivitiesOrder.value = [];
  
  // 应用当前排序选项
  if (sortOption.value && sortOption.value !== 'default') {
    applySortOption(sortOption.value);
  } else {
    activities.value = [...newActivities];
  }
}, { immediate: true });

// 切换排序模式 - 保留原函数以保持兼容性
const toggleTimeSort = () => {
  if (isTimeSorted.value) {
    sortOption.value = 'default';
  } else {
    sortOption.value = 'endTimeDesc';
  }
  applySortOption(sortOption.value);
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
  e.preventDefault();
  e.stopPropagation();
};

const handleMouseLeave = () => {
  isDragging.value = false;
};

// 日期面板相关
const selectedDay = ref(null);
const gameList = ref(StorageManager.get("gameList") || []);

const showDayPanel = (date) => {
  selectedDay.value = new Date(date);
  selectedDay.value.setHours(0, 0, 0, 0);
};

const hideDayPanel = () => {
  selectedDay.value = null;
};

// 存储ActivityItem组件的引用
const activityItemRefs = ref({});

// 注册ActivityItem组件的方法
const registerActivityItem = (activityUuid, component) => {
  activityItemRefs.value[activityUuid] = component;
};

// 注销ActivityItem组件的方法
const unregisterActivityItem = (activityUuid) => {
  delete activityItemRefs.value[activityUuid];
};

// 打开活动对话框
const openActivityDialog = (activity) => {
  if (activityItemRefs.value[activity.uuid]) {
    activityItemRefs.value[activity.uuid].openDialog();
  }
  // hideDayPanel(); // 可选：关闭日期面板
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
  const today = currentTime.value;
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
    const gameList = StorageManager.get("gameList") || [];
    const game = gameList.find((g) => g.game_id === gameId);
    return game ? game.color : "#607D8B";
  } catch (error) {
    console.error("Failed to load game color:", error);
    return "#607D8B";
  }
};

const loadAllStatuses = () => {
  try {
    const savedStatuses = StorageManager.get("activityStatus");
    return savedStatuses ? savedStatuses : {};
  } catch (error) {
    console.error("Failed to load activity statuses:", error);
    return {};
  }
};

const saveAllStatuses = (statuses) => {
  StorageManager.set("activityStatus", statuses);
};

// 获取活动状态图标
const getActivityStatusIcon = (activityUuid) => {
  const statuses = loadAllStatuses();
  const status = statuses[activityUuid] || "";
  switch (status) {
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
};

// 在 setup() 中
const activityStatuses = ref(loadAllStatuses());

const handleStatusChange = (uuid, status) => {
  activityStatuses.value[uuid] = status;
  saveAllStatuses(activityStatuses.value);
  activities.value = [...activities.value];
};

// 控制每个活动的菜单状态
const statusMenus = ref({});

// 设置活动状态
const setActivityStatus = (activityUuid, status) => {
  handleStatusChange(activityUuid, status); // 复用已有的状态变更逻辑
  statusMenus.value[activityUuid] = false; // 关闭菜单
};

const dayPanelActivityClick = (activity) => {
  openActivityDialog(activity);
  scrollToActivity(activity);
  // hideDayPanel();
};

const scrollToActivity = (activity) => {
  if (!cardTextRef.value) return;

  const container = cardTextRef.value.$el;
  const activityElement = document.querySelector(
    `[data-activity-uuid="${activity.uuid}"]`
  );

  if (activityElement) {
    const activityRect = activityElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // 计算活动位置
    const activityStart =
      activityRect.left - containerRect.left + container.scrollLeft;
    const activityEnd =
      activityRect.right - containerRect.left + container.scrollLeft;
    const containerWidth = containerRect.width;

    // 判断活动是否过长（超过容器宽度）
    const isActivityTooLong = activityRect.width > containerWidth;

    // 计算目标水平滚动位置
    let targetScrollLeft;
    if (isActivityTooLong) {
      // 对于过长的活动，总是滚动到开头
      targetScrollLeft = activityStart - 20; // 左侧留出20px边距
    } else {
      // 对于正常长度的活动，保留原有逻辑
      if (activityStart < container.scrollLeft) {
        targetScrollLeft = activityStart - 20; // 左侧留出边距
      } else if (activityEnd > container.scrollLeft + containerWidth) {
        targetScrollLeft = activityEnd - containerWidth + 20; // 右侧留出边距
      } else {
        // 活动已经在可视区域内，不需要滚动
        targetScrollLeft = container.scrollLeft;
      }
    }

    // 垂直滚动计算保持不变
    const activityTop =
      activityRect.top - containerRect.top + container.scrollTop;
    const activityBottom =
      activityRect.bottom - containerRect.top + container.scrollTop;
    const containerHeight = containerRect.height;

    let targetScrollTop = container.scrollTop;
    if (activityTop < container.scrollTop + 100) {
      targetScrollTop = activityTop - 100;
    } else if (activityBottom > container.scrollTop + containerHeight) {
      targetScrollTop = activityBottom - containerHeight + 20;
    }

    // 执行滚动
    container.scrollTo({
      left: targetScrollLeft,
      top: targetScrollTop,
      behavior: "smooth",
    });
  }
};

// const scrollToActivity = (activity) => {
//   if (!cardTextRef.value) return;

//   const container = cardTextRef.value.$el;
//   const activityElement = document.querySelector(
//     `[data-activity-uuid="${activity.uuid}"]`
//   );

//   if (activityElement) {
//     const activityRect = activityElement.getBoundingClientRect();
//     const containerRect = container.getBoundingClientRect();

//     // 水平滚动计算
//     const activityLeft =
//       activityRect.left - containerRect.left + container.scrollLeft;
//     const activityRight =
//       activityRect.right - containerRect.left + container.scrollLeft;
//     const containerWidth = containerRect.width;

//     // 垂直滚动计算（增加100px上边距）
//     const activityTop =
//       activityRect.top - containerRect.top + container.scrollTop;
//     const activityBottom =
//       activityRect.bottom - containerRect.top + container.scrollTop;
//     const containerHeight = containerRect.height;

//     // 计算目标水平滚动位置
//     let targetScrollLeft = container.scrollLeft;
//     if (activityLeft < container.scrollLeft) {
//       targetScrollLeft = activityLeft - 20; // 左侧留出边距
//     } else if (activityRight > container.scrollLeft + containerWidth) {
//       targetScrollLeft = activityRight - containerWidth + 20; // 右侧留出边距
//     }

//     // 计算目标垂直滚动位置（增加100px上边距）
//     let targetScrollTop = container.scrollTop;
//     if (activityTop < container.scrollTop + 100) {
//       // 修改这里，增加100px上边距
//       targetScrollTop = activityTop - 100; // 修改这里，增加100px上边距
//     } else if (activityBottom > container.scrollTop + containerHeight) {
//       targetScrollTop = activityBottom - containerHeight + 20;
//     }

//     // 执行滚动
//     container.scrollTo({
//       left: targetScrollLeft,
//       top: targetScrollTop,
//       behavior: "smooth",
//     });
//   }
// };
</script>

<style>
:root {
  --border-color-light: #e0e0e0;
  --border-color-dark: #616161;
}
</style>
<style scoped>
/* 基础样式 */
.timeline-root {
  background-color: #fff8;
}

.v-card {
  border-radius: 16px;
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
  border-color: var(--border-color-dark);
  background-color: #2228;
}

/* 时间轴头部 */
.sticky-header-container {
  position: sticky;
  top: 0;
  margin-top: -2px;
  /* background: inherit; */
  z-index: 2;
}

.timeline-header {
  display: flex;
  height: 24px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f5f5aa;
  font-size: 14px;
  font-weight: 500;
  min-width: max-content;
  backdrop-filter: blur(8px);
}

.v-theme--dark .timeline-header {
  background-color: #424242aa;
  border-bottom-color: var(--border-color-dark);
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
  padding-left: 10px;
  border-right: 1px solid #e0e0e0;
  white-space: nowrap;
  text-align: left;
  font-weight: bold;
  /* background-color: inherit; */
  flex-shrink: 0;
  /* margin-left: -1px; */
  padding-right: 10px;
  border-top: 1px solid #e0e0e0;
}

.v-theme--dark .month-cell {
  border-color: var(--border-color-dark);
}

.month-label {
  position: sticky;
  left: 12px;
  white-space: nowrap;
}

/* 日期单元格 */
/* 替换原来的.day-cell和.weekday-cell相关样式 */
.day-week-container {
  display: flex;
  min-width: max-content;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.day-week-row {
  display: flex;
}

.day-week-cell {
  min-width: 36px;
  width: 36px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
  flex-shrink: 0;
  cursor: pointer;
  background-color: #f5f5f5aa;
  backdrop-filter: blur(8px);
}

.v-theme--dark .day-week-cell {
  border-right-color: var(--border-color-dark);
  background-color: #424242aa;
}

.day-week-cell:hover,
.day-week-cell.weekend:hover {
  background-color: #aaa !important;
}

.v-theme--dark .day-week-cell:hover,
.v-theme--dark .day-week-cell.weekend:hover {
  background-color: #888 !important;
}

.day-week-cell.weekend {
  background-color: #eeea;
}

.v-theme--dark .day-week-cell.weekend {
  background-color: #555a;
}

.day-cell,
.weekday-cell {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e0e0e0;
}

.v-theme--dark .day-cell,
.v-theme--dark .weekday-cell {
  border-bottom-color: var(--border-color-dark);
}

.day-cell {
  font-weight: 500;
}

.weekday-cell {
  text-transform: capitalize;
}

.bold-text {
  font-weight: bold;
}

/* 当前时间显示 */
.timeline-time-header {
  display: flex;
  height: 24px;
  font-size: 14px;
  font-weight: 500;
  min-width: 100%;
  position: relative;
}

/* .v-theme--dark .timeline-time-header {
  background-color: #333;
  border-bottom-color: #616161;
} */

.current-time-display {
  position: absolute;
  top: 4px;
  transform: translateX(-50%);
  padding: 0 6px;
  color: rgb(var(--v-theme-warning));
  background-color: #fff;
  border-radius: 12px;
  z-index: 1;
  white-space: nowrap;
  outline: 2px solid rgb(var(--v-theme-warning));
  border-radius: 16px;
}

.v-theme--dark .current-time-display {
  color: #eee;
  background-color: rgb(var(--v-theme-accent));
  outline: 2px solid rgb(var(--v-theme-accent));
  border-radius: 16px;
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
  top: -24px;
  left: -1px;
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 0;
}

.activity-layer {
  position: relative;
  z-index: 1;
  padding-top: 6px;
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
  background-color: var(--border-color-dark);
  background-color: #616161;
}

.timeline-day.weekend {
  background-color: rgba(0, 0, 0, 0.02);
}

.v-theme--dark .timeline-day.weekend {
  background-color: rgba(255, 255, 255, 0.02);
}

.current-day .day-cell,
.current-day .weekday-cell {
  font-weight: bold;
}

.current-day {
  background-color: #fda !important;
}

.v-theme--dark .current-day {
  background-color: rgb(var(--v-theme-accent)) !important;
}

/* 当前时间指示器 */
.current-time-indicator {
  position: absolute;
  top: -24px;
  bottom: 0;
  width: 2px;
  background-color: rgb(var(--v-theme-warning));
  z-index: 20;
}

/* .current-time-indicator::before, */
.current-time-indicator::after {
  content: "";
  position: absolute;
  left: -3px;
  width: 8px;
  height: 8px;
  background-color: rgb(var(--v-theme-warning));
  border-radius: 50%;
}

/* .current-time-indicator::before {
  top: 2px;
} */

.current-time-indicator::after {
  bottom: -1px;
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
  gap: 4px;
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
  height: 20px;
  font-weight: bold;
  color: rgb(var(--v-theme-warning));
  width: 20px;
  margin-top: 4px;
  background: #fff;
  border-radius: 10px;
  outline: 2px solid rgb(var(--v-theme-warning));
}

.v-theme--dark .arrow-indicator {
  color: #eee;
  background: rgb(var(--v-theme-accent));
  outline: 2px solid rgb(var(--v-theme-accent));
}

.right-arrow {
  right: 8px;
  float: right;
  padding: 0px 1px 1px 3px;
}

.left-arrow {
  left: 12px;
  padding: 0px 1px 1px 2px;
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
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin-top: 20px;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
  border-bottom-color: var(--border-color-dark);
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
  user-select: none;
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
  padding: 16px;
  margin: 0px 16px;
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
  transition: all 0.2s ease;
}

.day-panel-enter-from,
.day-panel-leave-to {
  opacity: 0;
}

.day-panel-enter-active .day-panel,
.day-panel-leave-active .day-panel {
  transition-delay: 0.05s;
}

.day-panel-enter-from .day-panel,
.day-panel-leave-to .day-panel {
  transform: translateY(-20px);
  opacity: 0;
}

.day-panel-enter-active .day-panel-activity {
  transition-delay: calc(0.05s + var(--delay, 0) * 0.05s);
}

.day-panel-enter-from .day-panel-activity,
.day-panel-leave-to .day-panel-activity {
  transform: scaleY(0.8);
  opacity: 0;
}
</style>