<template>
  <div class="gacha-records">
    <v-card class="mb-2">
      <v-card-title class="d-flex flex-wrap align-center">
        <div class="d-flex align-center" style="min-width: 0;">
          <v-btn icon variant="text" @click="$router.back()" class="mr-2">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div class="mr-2 truncate" style="min-width: 0;">
            {{ $t("app.pages.gacha.records.title") }}
          </div>
          <v-chip variant="tonal" size="small" :color="getGameColor(selectedGame)">
            <v-icon left size="14">mdi-account</v-icon>
            {{ currentUid }}
          </v-chip>
        </div>
        <v-spacer></v-spacer>


        <!-- 星级筛选 -->
        <v-chip-group v-model="rarityFilter" multiple class="mr-2" filter>
          <v-chip v-for="rarity in selectedGame === 'zenless'
            ? ['S', 'A', 'B']
            : [5, 4, 3]" :key="rarity" :value="rarity" :color="getRarityColor(rarity)" variant="tonal" size="small">
            {{
              selectedGame === "zenless"
                ? `${rarity}${t("app.pages.gacha.records.rank")}`
                : rarity
            }}
            <v-icon v-if="selectedGame !== 'zenless'" left size="14">mdi-star</v-icon>
          </v-chip>
        </v-chip-group>
        <!-- 在屏幕宽度小于1100px时强制换行 -->
        <div class="responsive-break"></div>
        <div class="d-flex flex-nowrap" style="min-width: 0;">
          <!-- 卡池选择器 -->
          <v-select v-model="selectedGachaType" :items="currentGachaTypes" item-title="name" item-value="id"
            :label="$t('app.pages.gacha.records.selectGachaType')" variant="outlined" density="compact"
            hide-details="auto" style="width: 200px" class="mr-2" :disabled="loading"
            :color="getGameColor(selectedGame)">
            <template v-slot:selection="{ item }">
              <v-chip :color="getGameColor(selectedGame)" variant="tonal" size="small">
                {{ item.title }}
              </v-chip>
            </template>
          </v-select>

          <!-- 游戏选择器 -->
          <v-select v-model="selectedGame" :items="gameOptions" item-title="name" item-value="id"
            :label="$t('app.pages.gacha.overview.selectGame')" variant="outlined" density="compact" hide-details="auto"
            style="width: 200px" :disabled="loading" :color="getGameColor(selectedGame)">
            <template v-slot:selection="{ item }">
              <v-chip :color="getGameColor(item.value)" variant="tonal" size="small">
                {{ item.title }}
              </v-chip>
            </template>
          </v-select>
        </div>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-0">
        <!-- 数据表格 -->
        <v-data-table :headers="headers" :items="filteredGachaRecords" :items-per-page="10" class="gacha-table"
          v-model:sort-by="sortBy" :loading="loading ? 'accent' : false" no-data-text="app.pages.gacha.records.noData"
          :custom-sort="customSort" density="comfortable" :items-per-page-options="[10, 20, 50, 100]">
          <!-- ID列 -->
          <template v-slot:item.id="{ item }">
            <span class="text-body-2">{{ item.id }}</span>
          </template>

          <!-- 时间列 -->
          <template v-slot:item.time="{ item }">
            <span class="text-body-2">{{ formatTime(item.time) }}</span>
          </template>

          <!-- 名称列 -->
          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center">
              <v-avatar :color="getRarityColor(item.rank_type)" size="24" class="mr-2">
                <v-icon size="14" color="white">
                  {{
                    isCharacterType(item.item_type)
                      ? "mdi-account"
                      : isBangbooType(item.item_type)
                        ? "mdi-robot"
                        : "mdi-sword"
                  }}
                </v-icon>
              </v-avatar>
              <span class="font-weight-medium">{{ getItemName(item) }}</span>
            </div>
          </template>

          <!-- 星级列 -->
          <template v-slot:item.rank_type="{ item }">
            <v-chip :color="getRarityColor(item.rank_type)" variant="tonal" size="small">
              {{
                selectedGame === "zenless"
                  ? `${getZenlessRank(item.rank_type)}`
                  : item.rank_type
              }}
              <v-icon v-if="selectedGame !== 'zenless'" left size="14">mdi-star</v-icon>
            </v-chip>
          </template>

          <!-- 类型列模板 -->
          <template v-slot:item.item_type="{ item }">
            <v-chip :color="getTypeColor(item.item_type)" variant="outlined" size="small">
              <v-icon left size="14">
                {{
                  isCharacterType(item.item_type)
                    ? "mdi-account"
                    : isBangbooType(item.item_type)
                      ? "mdi-robot"
                      : "mdi-sword"
                }}
              </v-icon>
              {{
                $t(
                  `app.pages.gacha.itemTypes.${getTypeTranslationKey(
                    item.item_type
                  )}`
                )
              }}
            </v-chip>
          </template>
          <!-- 类型列 -->

          <!-- 抽数列 -->
          <template v-slot:item.pull_count="{ item }">
            <div class="d-flex align-center justify-center">
              <v-chip v-if="item.rank_type !== (selectedGame === 'zenless' ? 2 : 3)"
                :color="getPullCountColor(item.pull_count, item.rank_type)" :variant="item.rank_type == (selectedGame === 'zenless' ? 2 : 3)
                    ? 'text'
                    : 'flat'
                  " size="small" class="mr-1">
                {{ item.pull_count }}
              </v-chip>
              <span v-else>-</span>

              <!-- 保底状态图标 -->
              <v-avatar v-if="shouldShowGuaranteeIcon(item)" :color="getGuaranteeIconColor(item)" size="24"
                class="ml-1">
                <v-icon color="white" size="14">
                  {{ getGuaranteeIcon(item) }}
                </v-icon>
              </v-avatar>
            </div>
          </template>
        </v-data-table></v-card-text></v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { i18n, loadGameTranslations } from "@/i18n";
import StorageManager from "@/utils/StorageManager";
import { IndexedDBManager } from "@/utils/IndexedDBManager";

const { t, d: $d, locale } = useI18n();

const dbManager = new IndexedDBManager("GachaTrackerDB_v2");
const dbInitialized = ref(false);

// 初始化存储结构
const initStorageStructure = () => {
  const defaultSelections = {
    genshin: "301",
    starrail: "11",
    zenless: "2",
    wuthering: "1",
  };

  if (!StorageManager.get("gachaSelections")) {
    StorageManager.set("gachaSelections", defaultSelections);
  }
  if (!StorageManager.get("gachaSelectedGame")) {
    StorageManager.set("gachaSelectedGame", "genshin");
  }
};

// 先初始化存储结构
initStorageStructure();

// 响应式数据
const selectedGame = ref(StorageManager.get("gachaSelectedGame") || "genshin");
const gachaSelections = ref(
  StorageManager.get("gachaSelections") || {
    genshin: "301",
    starrail: "11",
    zenless: "2",
    wuthering: "1",
  }
);
const selectedGachaType = ref(
  gachaSelections.value[selectedGame.value] || "301"
);
const rarityFilter = ref();
const loading = ref(false);
const gachaRecords = ref([]);
const processedRecords = ref([]); // 存储处理后的完整记录

// Zenless Rank 转换
const getZenlessRank = (rankType) => {
  const rankMap = {
    4: "S",
    3: "A",
    2: "B",
  };
  return rankMap[rankType] || rankType;
};

// 计算同星级物品的抽数和递增ID（基于完整数据）
const calculatePullCounts = (records) => {
  // 按时间排序
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.time) - new Date(b.time)
  );

  // 为每条记录添加递增ID
  sortedRecords.forEach((record, index) => {
    record.id = index + 1;
  });

  // 初始化计数器
  const counters = {
    5: 0,
    4: 0,
    3: 0,
  };

  // 记录上一个同星级物品的索引
  const lastIndex = {
    5: -1,
    4: -1,
    3: -1,
  };

  // 为每个记录计算抽数
  return sortedRecords.map((record, index) => {
    let rarity = parseInt(record.rank_type);

    // 如果是 Zenless 游戏，转换 rarity 为对应的数字
    if (selectedGame.value === "zenless") {
      rarity = { 2: 3, 3: 4, 4: 5 }[rarity] || rarity;
    }

    // 增加所有计数器
    counters[5]++;
    counters[4]++;
    counters[3]++;

    // 如果是第一个同星级物品，抽数为当前计数器值
    if (lastIndex[rarity] === -1) {
      lastIndex[rarity] = index;
      return {
        ...record,
        pull_count: rarity === 3 ? null : counters[rarity],
      };
    }

    // 计算与上一个同星级物品之间的抽数
    const pullCount = index - lastIndex[rarity];
    lastIndex[rarity] = index;

    // 重置当前稀有度计数器
    counters[rarity] = 0;

    // 如果是 Zenless 游戏且抽到 S 级 (5星)，同时重置 A 级 (4星) 计数器
    if (
      (selectedGame.value === "zenless" ||
        selectedGame.value === "wuthering") &&
      rarity === 5
    ) {
      counters[4] = 0;
      lastIndex[4] = index;
    }

    return {
      ...record,
      pull_count: rarity === 3 ? null : pullCount,
    };
  });
};

// 过滤后的抽卡记录（仅应用星级筛选）
const filteredGachaRecords = computed(() => {
  return processedRecords.value.filter((item) => {
    const rank = parseInt(item.rank_type);
    if (selectedGame.value === "zenless") {
      const zenlessRank = getZenlessRank(rank);
      return rarityFilter.value.includes(zenlessRank);
    }
    return rarityFilter.value.includes(rank);
  });
});

const sortBy = ref([{ key: "time", order: "desc" }]);

// 表格头部
const headers = computed(() => [
  {
    title: t("app.pages.gacha.records.pullCount"),
    key: "id",
    sortable: false,
    width: "70px",
    minWidth: "70px",
  },
  {
    title: t("app.pages.gacha.records.time"),
    key: "time",
    sortable: true,
    width: "180px",
    sortRaw: (a, b) => {
      const timeCompare =
        new Date(a.time).getTime() - new Date(b.time).getTime();
      if (timeCompare === 0) {
        return a.id - b.id;
      }
      return timeCompare;
    },
  },
  {
    title: t("app.pages.gacha.records.name"),
    key: "name",
    sortable: true,
    width: "300px",
    minWidth: "150px",
  },
  {
    title: t("app.pages.gacha.records.rarity"),
    key: "rank_type",
    sortable: true,
    width: "90px",
    minWidth: "90px",
  },
  {
    title: t("app.pages.gacha.records.type"),
    key: "item_type",
    sortable: true,
    width: "120px",
  },
  {
    title: t("app.pages.gacha.records.lastCount"),
    key: "pull_count",
    sortable: true,
    width: "120px",
    align: "center",
    minWidth: "120px",
  },
]);

// 游戏选项
const gameOptions = computed(() => [
  { id: "genshin", name: t("app.games.genshin.title") },
  { id: "starrail", name: t("app.games.starrail.title") },
  { id: "zenless", name: t("app.games.zenless.title") },
  { id: "wuthering", name: t("app.games.wuthering.title") },
]);

// 各游戏的卡池类型
const gachaTypeOptions = computed(() => ({
  genshin: [
    { id: "301", name: t("app.pages.gacha.types.genshin.301") },
    { id: "302", name: t("app.pages.gacha.types.genshin.302") },
    { id: "500", name: t("app.pages.gacha.types.genshin.500") },
    { id: "200", name: t("app.pages.gacha.types.genshin.200") },
    { id: "100", name: t("app.pages.gacha.types.genshin.100") },
  ],
  starrail: [
    { id: "11", name: t("app.pages.gacha.types.starrail.11") },
    { id: "12", name: t("app.pages.gacha.types.starrail.12") },
    { id: "21", name: t("app.pages.gacha.types.starrail.21") },
    { id: "22", name: t("app.pages.gacha.types.starrail.22") },
    { id: "1", name: t("app.pages.gacha.types.starrail.1") },
    { id: "2", name: t("app.pages.gacha.types.starrail.2") },
  ],
  zenless: [
    { id: "2", name: t("app.pages.gacha.types.zenless.2") },
    { id: "3", name: t("app.pages.gacha.types.zenless.3") },
    { id: "1", name: t("app.pages.gacha.types.zenless.1") },
    { id: "5", name: t("app.pages.gacha.types.zenless.5") },
  ],
  wuthering: [
    { id: "1", name: t("app.pages.gacha.types.wuthering.1") },
    { id: "2", name: t("app.pages.gacha.types.wuthering.2") },
    { id: "3", name: t("app.pages.gacha.types.wuthering.3") },
    { id: "4", name: t("app.pages.gacha.types.wuthering.4") },
    { id: "5", name: t("app.pages.gacha.types.wuthering.5") },
    { id: "6", name: t("app.pages.gacha.types.wuthering.6") },
    { id: "7", name: t("app.pages.gacha.types.wuthering.7") },
    { id: "8", name: t("app.pages.gacha.types.wuthering.8") },
    { id: "9", name: t("app.pages.gacha.types.wuthering.9") },
  ],
}));

// 当前游戏的卡池类型
const currentGachaTypes = computed(() => {
  return gachaTypeOptions.value[selectedGame.value] || [];
});

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

// 获取稀有度颜色
const getRarityColor = (rarity) => {
  if (selectedGame.value === "zenless") {
    const colors = {
      S: "amber-darken-4",
      A: "purple-lighten-2",
      B: "blue-darken-1",
      4: "amber-darken-4",
      3: "purple-lighten-2",
      2: "blue-darken-1",
    };
    return colors[rarity] || "grey";
  }

  const colors = {
    5: "amber-darken-4",
    4: "purple-lighten-2",
    3: "blue-darken-1",
  };
  return colors[rarity] || "grey";
};

// 判断是否为角色类型
const isCharacterType = (type) => {
  return ["Character", "Resonator", "Agents"].includes(type);
};
const isBangbooType = (type) => {
  return type === "Bangboo";
};

// 获取类型颜色
const getTypeColor = (type) => {
  return isCharacterType(type)
    ? "blue"
    : isBangbooType(type)
      ? "pink-lighten-2"
      : "green";
};

// 获取抽数颜色
const getPullCountColor = (count, rarity) => {
  const effectiveRarity =
    selectedGame.value === "zenless"
      ? { 2: 3, 3: 4, 4: 5 }[rarity] || rarity
      : rarity;

  if (effectiveRarity == 5) {
    if (count <= 35) return "#4CAF50"; // green
    if (count <= 45) return "#8BC34A"; // light green
    if (count <= 55) return "#FFEB3B"; // yellow
    if (count <= 60) return "#FFC107"; // gold
    if (count <= 65) return "#FF9800"; // orange
    if (count <= 70) return "#FF5722"; // dark orange
    if (count <= 75) return "#F44336"; // red
    return "#B71C1C"; // dark red
  } else if (effectiveRarity == 4) {
    if (count <= 5) return "#E0E0E0"; // light grey
    if (count <= 8) return "#C8C8C8"; // medium grey
    if (count <= 9) return "#BDBDBD"; // dark grey
    return "#B0B0B0"; // darker grey
  }
  return "grey";
};

// 自定义排序函数
const customSort = (items, sortBy) => {
  if (!sortBy.length) return items;

  const sortKey = sortBy[0].key;
  const sortOrder = sortBy[0].order;

  return [...items].sort((a, b) => {
    // 主要排序字段
    let compareA = a[sortKey];
    let compareB = b[sortKey];

    // 如果排序字段是时间，添加次要排序字段（ID）
    if (sortKey === "time") {
      // 先比较时间
      const timeCompare =
        new Date(compareA).getTime() - new Date(compareB).getTime();

      // 如果时间相同，再比较ID
      if (timeCompare === 0) {
        const idCompare = a.id - b.id;
        return sortOrder === "desc" ? -idCompare : idCompare;
      }

      return sortOrder === "desc" ? -timeCompare : timeCompare;
    }

    // 其他字段的默认排序
    if (compareA < compareB) return sortOrder === "desc" ? 1 : -1;
    if (compareA > compareB) return sortOrder === "desc" ? -1 : 1;
    return 0;
  });
};

// 格式化时间
const formatTime = (timeStr) => {
  const date = new Date(timeStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 保存选择设置
const saveSelections = () => {
  // 更新当前游戏的卡池类型选择
  gachaSelections.value[selectedGame.value] = selectedGachaType.value;

  // 处理星级过滤器
  let filterToSave = [...rarityFilter.value];
  if (selectedGame.value === "zenless") {
    // 将S/A/B转换为5/4/3存储
    filterToSave = filterToSave.map((r) => {
      if (r === "S") return 5;
      if (r === "A") return 4;
      if (r === "B") return 3;
      return r;
    });
  }

  // 保存到Storage
  StorageManager.set("gachaSelections", gachaSelections.value);
  StorageManager.set("gachaSelectedGame", selectedGame.value);
  StorageManager.set("gachaRarityFilter", filterToSave);
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  await loadGameTranslations(selectedGame.value, i18n.global.locale.value);
  try {
    if (!dbInitialized.value) {
      await dbManager.openDB();
      dbInitialized.value = true;
    }

    // 从IndexedDB获取数据
    const uid = StorageManager.get("gachaUids")?.selected[selectedGame.value];
    if (!uid) {
      gachaRecords.value = [];
      processedRecords.value = [];
      return;
    }

    const tableName = `${selectedGame.value}-${uid}`;
    const allRecords = await dbManager.getAllGachaRecords(tableName);

    // 按卡池类型过滤
    gachaRecords.value = allRecords.filter(
      (record) => record.uigf_gacha_type === selectedGachaType.value
    );

    // 处理完整记录（计算ID和抽数）
    processedRecords.value = calculatePullCounts(gachaRecords.value);
  } catch (error) {
    console.error("Failed to load data:", error);
    gachaRecords.value = [];
    processedRecords.value = [];
  } finally {
    loading.value = false;
  }
};

const currentUid = computed(() => {
  const uids = StorageManager.get("gachaUids")?.selected || {};
  return uids[selectedGame.value] || t("app.pages.gacha.records.noUidSelected");
});

// 判断是否为歪卡池的角色
const isOffBannerCharacter = (item) => {
  if (selectedGame.value === "genshin") {
    const offBannerNames = [
      "Jean",
      "Qiqi",
      "Diluc",
      "Keqing",
      "Mona",
      "Tighnari",
      "Dehya",
      "YumemizukiMizuki",
      "AmosBow",
      "PrimordialJadeWingedSpear",
      "WolfsGravestone",
      "AquilaFavonia",
      "LostPrayertotheSacredWinds",
      "SkywardHarp",
      "SkywardPride",
      "SkywardSpine",
      "SkywardBlade",
      "SkywardAtlas",
    ];
    return offBannerNames.includes(item.name.replace(/[^a-zA-Z0-9]/g, ""));
  } else if (selectedGame.value === "starrail") {
    const offBannerNames = [
      "Bronya",
      "Welt",
      "Gepard",
      "Clara",
      "Himeko",
      "Yanqing",
      "Bailu",
      "NightontheMilkyWay",
      "SomethingIrreplaceable",
      "ButtheBattleIsntOver",
      "IntheNameoftheWorld",
      "MomentofVictory",
      "SleepLiketheDead",
      "TimeWaitsforNoOne",
      "FuXuan",
      "Blade",
      "Seele",
    ];
    return offBannerNames.includes(item.name.replace(/[^a-zA-Z0-9]/g, ""));
  } else if (selectedGame.value === "zenless") {
    const offBannerNames = [
      "Lycaon",
      "Rina",
      "Grace",
      "Soldier11",
      "Koleda",
      "Nekomata",
      "FusionCompiler",
      "SteelCushion",
      "WeepingCradle",
      "HellfireGears",
      "TheRestrained",
      "TheBrimstone",
    ];
    return offBannerNames.includes(item.name.replace(/[^a-zA-Z0-9]/g, ""));
  } else if (selectedGame.value === "wuthering") {
    const offBannerNames = [
      "Verina",
      "Encore",
      "Calcharo",
      "Jianxin",
      "Lingyang",
    ];
    return offBannerNames.includes(item.name.replace(/[^a-zA-Z0-9]/g, ""));
  }
  return false;
};

const isPermanentGacha = (item) => {
  const gachaType = item.uigf_gacha_type;

  switch (selectedGame.value) {
    case "genshin":
      return gachaType === "200" || gachaType === "500" || gachaType === "100"; // 原神常驻池
    case "starrail":
      return gachaType === "1" || gachaType === "2"; // 星铁常驻池
    case "zenless":
      return gachaType === "1" || gachaType === "5"; // 绝区零常驻池
    case "wuthering":
      return gachaType !== "1" && gachaType !== "8"; // 鸣潮除1,8以外的池子
    default:
      return false;
  }
};

// 修改shouldShowGuaranteeIcon函数
const shouldShowGuaranteeIcon = (item) => {
  if (isPermanentGacha(item)) return false;

  const rarity = parseInt(item.rank_type);
  const effectiveRarity =
    selectedGame.value === "zenless"
      ? { 2: 3, 3: 4, 4: 5 }[rarity] || rarity
      : rarity;

  return effectiveRarity === 5;
};

// 获取保底图标
const getGuaranteeIcon = (item) => {
  const guaranteeStatus = getGuaranteeStatus(item);
  if (guaranteeStatus === "lost") return "mdi-star-off";
  if (guaranteeStatus === "guaranteed") return "mdi-star-outline";
  return "mdi-star";
};

// 修改getGuaranteeIconColor函数
const getGuaranteeIconColor = (item) => {
  const guaranteeStatus = getGuaranteeStatus(item);
  if (guaranteeStatus === "lost") return "red-darken-2";
  if (guaranteeStatus === "guaranteed") return "amber-darken-4";
  return "green-darken-2";
};

// 获取保底状态
// 获取保底状态
const getGuaranteeStatus = (item) => {
  const rarity = parseInt(item.rank_type);
  const effectiveRarity =
    selectedGame.value === "zenless"
      ? { 2: 3, 3: 4, 4: 5 }[rarity] || rarity
      : rarity;

  if (effectiveRarity !== 5) return null;

  // 如果是常驻池，不显示保底状态
  if (isPermanentGacha(item)) return null;

  // 首先判断当前物品是否为歪卡池角色
  const isCurrentOffBanner = isOffBannerCharacter(item);

  // 获取当前记录在完整列表中的索引
  const recordIndex = processedRecords.value.findIndex((r) => r.id === item.id);
  if (recordIndex === -1) return null;

  // 查找前一个五星/S Rank物品
  let prev5StarIndex = -1;
  for (let i = recordIndex - 1; i >= 0; i--) {
    const prevRarity = parseInt(processedRecords.value[i].rank_type);
    const prevEffectiveRarity =
      selectedGame.value === "zenless"
        ? { 2: 3, 3: 4, 4: 5 }[prevRarity] || prevRarity
        : prevRarity;

    if (prevEffectiveRarity === 5) {
      prev5StarIndex = i;
      break;
    }
  }

  // 如果没有前一个五星/S Rank物品（即这是第一个五星）
  if (prev5StarIndex === -1) {
    return isCurrentOffBanner ? "lost" : "normal";
  }

  const prevItem = processedRecords.value[prev5StarIndex];
  const isPrevOffBanner = isOffBannerCharacter(prevItem);

  // 判断逻辑：
  // 1. 如果前一个是歪卡池角色，当前不是歪卡池角色 → 保底中(黄色)
  // 2. 如果前一个不是歪卡池角色，当前是歪卡池角色 → 歪了(红色)
  // 3. 其他情况 → 正常(绿色)
  if (isPrevOffBanner && !isCurrentOffBanner) {
    return "guaranteed";
  } else if (!isPrevOffBanner && isCurrentOffBanner) {
    return "lost";
  } else {
    return "normal";
  }
};

// 获取类型翻译键
const getTypeTranslationKey = (type) => {
  const typeMap = {
    Character: "character",
    Weapon: "weapon",
    "Light Cone": "lightCone",
    Agents: "agents",
    "W-Engines": "wEngines",
    Resonator: "resonator",
  };
  return typeMap[type] || type;
};

const getItemName = (item) => {
  // 如果当前语言是英语，直接返回原名
  if (i18n.global.locale.value === "en") {
    return item.name;
  }

  // 首先处理名称：只保留英文字母、数字和空格
  let cleanedName = item.name.replace(/[^a-zA-Z0-9\s]/g, "");
  if (selectedGame.value !== "starrail") {
    cleanedName = cleanedName.replace(/\s+of\s+/gi, " Of ");
  }

  // 根据游戏类型处理空格
  let normalizedName;
  if (
    selectedGame.value === "wuthering" ||
    selectedGame.value === "starrail" ||
    selectedGame.value === "zenless"
  ) {
    // 鸣潮：用连字符替代空格
    normalizedName = cleanedName.replace(/\s+/g, "-");
  } else {
    // 其他游戏：直接移除空格
    normalizedName = cleanedName.replace(/\s+/g, "");
  }
  // 构建翻译键
  const translationKey = `app.pages.gacha.items.${selectedGame.value}.${normalizedName}`;
  // 直接检查消息树是否存在这个key
  if (!i18n.global.te(translationKey)) {
    return item.name;
  }

  return i18n.global.t(translationKey);
};

// 监听游戏选择变化
// 监听游戏选择变化
watch(selectedGame, async (newGame, oldGame) => {
  gachaRecords.value = [];
  processedRecords.value = [];
  // 加载新游戏的翻译
  await loadGameTranslations(newGame, i18n.global.locale.value);
  // 切换游戏时，自动选择该游戏上次使用的卡池类型
  selectedGachaType.value =
    gachaSelections.value[newGame] ||
    (gachaTypeOptions.value[newGame] &&
      gachaTypeOptions.value[newGame][0]?.id) ||
    "301";

  // 转换星级过滤器而不是重置
  if (newGame === "zenless" && oldGame !== "zenless") {
    // 从普通星级映射到绝区零Rank
    rarityFilter.value = rarityFilter.value.map((r) => {
      if (r === 5) return "S";
      if (r === 4) return "A";
      if (r === 3) return "B";
      return r;
    });
  } else if (newGame !== "zenless" && oldGame === "zenless") {
    // 从绝区零Rank映射回普通星级
    rarityFilter.value = rarityFilter.value.map((r) => {
      if (r === "S") return 5;
      if (r === "A") return 4;
      if (r === "B") return 3;
      return r;
    });
  }
  saveSelections();
  loadData();
});

// 监听卡池类型变化
watch(selectedGachaType, () => {
  saveSelections();
  loadData();
});

watch(locale, () => {
  loadData();
});

// 监听星级筛选变化
watch(
  rarityFilter,
  () => {
    saveSelections();
  },
  { deep: true }
);

onMounted(() => {
  const savedFilter =
    StorageManager.get("gachaRarityFilter") ||
    (selectedGame.value === "zenless" ? ["S", "A", "B"] : [5, 4, 3]);

  if (selectedGame.value === "zenless") {
    rarityFilter.value = savedFilter.map((r) => {
      if (r === 5) return "S";
      if (r === 4) return "A";
      if (r === 3) return "B";
      return r;
    });
  } else {
    rarityFilter.value = savedFilter;
  }
  loadData();
});
</script>

<style scoped>
.gacha-records {
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
  background-color: #fffa;
  border-radius: 16px;
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); */
}

.v-theme--dark .v-card {
  background-color: #444a;
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); */
}

.gacha-table {
  border-radius: 0 0 16px 16px;
}

/* 表格行悬停效果 */
:deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

/* 表格头部样式 */
:deep(.v-data-table-header__content) {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

/* 响应式断点 - 1000px以下屏幕宽度换行 */
@media (max-width: 1000px) {
  .responsive-break {
    width: 100%;
    flex-basis: 100%;
    height: 0;
  }
  
  /* 让两个v-selector居右 */
  .v-card-title .d-flex.flex-nowrap {
    margin-left: auto;
  }

  .v-card-title .v-select {
    width: 500px !important;
    max-width: 500px !important;
    margin-bottom: 12px;
  }
}

/* 移动端响应式 */
@media (max-width: 600px) {
  .v-card-title {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  /* 让两个v-select垂直排列 */
  .v-card-title .d-flex.flex-nowrap {
    display: block !important;
    width: 100%;
  }
  
  /* 确保每个v-select占据100%宽度且有适当的间距 */
  .v-card-title .v-select {
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 12px;
  }
  
  /* 移除第二个v-select的底部间距 */
  .v-card-title .v-select:last-child {
    margin-bottom: 0;
  }
  
  /* 重置原来的间距 */
  .v-select {
    width: 100%;
    max-width: 100% !important;
    margin-top: 8px;
  }

  :deep(.v-data-table) {
    font-size: 0.875rem;
  }

  :deep(.v-data-table__td) {
    padding: 8px 4px;
  }

  /* 星级筛选在小屏幕上换行 */
  .v-chip-group {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .v-chip-group .v-chip {
    margin: 2px;
  }
}

/* 表格头部样式 */
:deep(.v-data-table-header__content) {
  font-weight: 600;
  color: rgb(var(--v-theme-accent));
  /* 从 primary 改为 accent */
}

/* 表格头部背景色 */
:deep(.v-data-table-header) {
  background-color: rgba(var(--v-theme-accent), 0.1);
  /* 添加背景色 */
}

/* 排序按钮颜色 */
:deep(.v-data-table-header__sort-btn) {
  color: rgb(var(--v-theme-accent));
}
</style>