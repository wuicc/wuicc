<template>
  <v-card class="genshin-activities-container">
    <!-- 只在简体中文语言下显示页面内容 -->
    <template v-if="locale === 'zh-Hans'">
      <v-card-title class="my-2">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-package</v-icon>
          原神活动数据
        </div>
        <v-spacer></v-spacer>
      </v-card-title>
      <v-card-text>
        <!-- 文件上传部分 -->
        <v-card class="mb-4" elevation="2">
          <v-card-title class="text-h6">
            <v-icon left>mdi-upload</v-icon>
            上传活动数据
          </v-card-title>
          <v-card-text>
            <input type="file" ref="fileInput" accept=".json" style="display: none" @change="handleFileUpload" />
            <v-row>
              <v-col>
                <v-row class="mb-0">
                  <v-col cols="12" sm="auto" class="d-flex flex-column flex-sm-row align-start align-sm-center gap-2">
                    <v-btn color="success" @click="triggerFileUpload" :disabled="loading" class="mr-sm-4 mb-3 mb-sm-0">
                      <v-icon left>mdi-file</v-icon>
                      选择响应JSON文件
                    </v-btn>

                    <v-btn color="error" @click="confirmDeleteData" v-if="Object.keys(activities).length > 0">
                      <v-icon left>mdi-delete</v-icon>
                      删除所有数据
                    </v-btn>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
            <span class="text-sm text-secondary">所有数据仅在本地处理，不上传到服务器</span>

            <v-alert v-if="uploadStatus.show" :type="uploadStatus.type" class="mt-4" dense v-model="uploadStatus.show">
              <div class="d-flex justify-between items-center">
                <span>{{ uploadStatus.message }}</span>
                <v-btn v-if="uploadStatus.retry && uploadStatus.retryCallback" :loading="loading" :disabled="loading"
                  text color="currentColor" @click="uploadStatus.retryCallback()">
                  重试
                </v-btn>
              </div>
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- 米游社API信息 -->
        <v-expansion-panels class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon left>mdi-information</v-icon>
              &nbsp;如何获取活动数据
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card elevation="0">
                <v-card-text>
                  <v-alert type="info" dense>
                    <p>截至2025年10月24日，仍然可以调用米游社API获取历史活动数据，但未来可能会关闭此接口，可以使用下方的命令快速获取历史活动数据<br>
                      注意：需要先获取米游社Cookie，具体方法请搜索并参考如何获取Cookie的教程<br>
                      如果存在疑虑，请自行下载脚本内容并检查，或通过其他方式获得活动数据
                    </p>
                  </v-alert>

                  <div class="mt-4">
                    <v-textarea readonly variant="outlined" density="comfortable" :model-value="windowsScript" rows="2"
                      hide-details class="mb-2"></v-textarea>
                    <v-btn class="float-right" variant="outlined" size="small" @click="copyToClipboard(windowsScript)"
                      :color="copySuccess ? 'success' : 'accent'">
                      <v-icon left>
                        {{ copySuccess ? "mdi-check" : "mdi-content-copy" }}
                      </v-icon>
                      {{ copySuccess ? "已复制" : "复制" }}
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- 活动列表 -->
        <template v-if="!loading">
          <!-- 无数据提示 -->
          <div v-if="Object.keys(activities).length === 0" class="text-center py-10">
            <v-icon size="64" color="grey-lighten-1">mdi-calendar-blank</v-icon>
            <p class="mt-4 text-medium-emphasis">暂无活动数据</p>
            <v-btn color="accent" class="mt-2" @click="triggerFileUpload">
              上传活动数据
            </v-btn>
          </div>

          <!-- 活动列表 -->
          <div v-else class="activities-list">
            <!-- 已支持的活动 -->
            <v-card class="mb-4" elevation="2">
              <v-card-title class="text-h6 mb-2">
                <v-icon left>mdi-star-circle</v-icon>
                已支持活动 ({{ Object.keys(supportedActivities).length }})
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col v-for="(activity, activityId) in supportedActivities" :key="activityId" cols="12" md="6" lg="4"
                    class="pa-2">
                    <v-card class="mb-0 cursor-pointer" variant="tonal" @click="selectActivity(activityId)">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2" :color="getMetadata(activityId)?.icon ? 'accent' : 'grey'">
                          {{ getMetadata(activityId)?.icon || 'mdi-help-circle-outline' }}
                        </v-icon>
                        <h3 class="text-h6 mb-0 mr-2">{{ getActivityTitle(activity, activityId) }}</h3>
                        <v-chip v-if="getMetadata(activityId)?.not_shown" color="grey-darken-2" text size="small">
                          隐藏
                        </v-chip>
                      </v-card-title>
                      <v-card-text>
                        <p class="text-sm text-medium-emphasis">
                          {{ getActivitySummary(activity, activityId) }}
                        </p>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
                <div v-if="Object.keys(supportedActivities).length === 0" class="text-center py-4">
                  <p class="text-medium-emphasis">暂无已支持的活动</p>
                </div>
              </v-card-text>
            </v-card>

            <!-- 未支持的活动 -->
            <v-expansion-panels>
              <v-expansion-panel elevation="2">
                <v-expansion-panel-title class="text-h6">
                  <template v-slot:default="{ expanded }">
                    <v-icon left class="mr-2">mdi-help-circle-outline</v-icon>
                    未支持活动 ({{ Object.keys(unsupportedActivities).length }})
                    <v-chip color="warning" text class="ml-4">
                      暂未支持
                    </v-chip>
                  </template>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                  <v-row>
                    <v-col v-for="(activity, activityId) in unsupportedActivities" :key="activityId" cols="12" md="6"
                      lg="4" class="pa-2">
                      <v-card class="mb-0 cursor-pointer" @click="selectActivity(activityId)" variant="tonal">
                        <v-card-title class="d-flex align-center">
                          <v-icon class="mr-2" :color="getMetadata(activityId)?.icon ? 'accent' : 'grey'">
                            {{ getMetadata(activityId)?.icon || 'mdi-help-circle-outline' }}
                          </v-icon>
                          <h3 class="text-h6 mb-0 mr-2">{{ getActivityTitle(activity, activityId) }}</h3>
                          <v-chip v-if="getMetadata(activityId)?.not_shown" color="grey-darken-2" text size="small">
                            隐藏
                          </v-chip>
                        </v-card-title>
                        <v-card-text>
                          <p class="text-sm text-medium-emphasis">
                            {{ getActivitySummary(activity, activityId) }}
                          </p>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                  <div v-if="Object.keys(unsupportedActivities).length === 0" class="text-center py-4">
                    <p class="text-medium-emphasis">暂无未支持的活动</p>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </template>

        <!-- 活动详情对话框 -->
        <v-dialog v-model="showActivityDetail" max-width="900px">
          <v-card>
            <v-card-title class="pa-4">
              <div class="d-flex align-start justify-space-between w-100">
                <!-- 左侧标题区域 -->
                <div class="d-flex flex-column flex-grow-1">
                  <div class="d-flex align-center flex-wrap">
                    <v-icon class="mr-2" :color="getMetadata(currentActivityId)?.icon ? 'accent' : 'grey'">
                      {{ getMetadata(currentActivityId)?.icon || 'mdi-help-circle-outline' }}
                    </v-icon>
                    <span class="text-h5 mr-2" style="word-break: break-word;">{{ currentActivityTitle }}
                      <v-chip v-if="getMetadata(currentActivityId)?.not_shown" color="grey-darken-2" text size="small"
                        class="my-1">
                        隐藏
                      </v-chip></span>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1 ml-10">{{ currentActivityId }}</div>
                </div>

                <!-- 右侧关闭按钮 -->
                <v-btn icon @click="closeActivityDetail" size="large" variant="text" class="ml-4 flex-shrink-0">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="activity-detail-content pa-0">
              <!-- 不支持的活动提示 -->
              <div v-if="!isCurrentActivitySupported" class="text-center py-10">
                <v-icon size="64" color="warning">mdi-alert-circle</v-icon>
                <p class="mt-4 text-medium-emphasis">暂未支持该活动</p>
                <p class="text-sm text-muted">活动ID: {{ currentActivityId }}</p>
              </div>
              <!-- 活动组件 -->
              <div v-else class="activity-component-container">
                <component :is="currentActivityComponent" :activity-data="currentActivityData" />
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- 删除确认对话框 -->
        <v-dialog v-model="deleteConfirmDialog" max-width="400">
          <v-card>
            <v-card-title class="d-flex align-center flex-wrap">
              <div class="d-flex align-center flex-grow-1">
                <v-icon color="error" class="mr-2" style="margin-top: -1px;">mdi-alert-decagram</v-icon>
                确认删除
              </div>
            </v-card-title>
            <v-card-text>
              确定要删除所有活动数据吗？此操作不可恢复。
            </v-card-text>
            <v-card-actions>
              <v-btn @click="deleteConfirmDialog = false">取消</v-btn>
              <v-btn color="error" @click="deleteAllData" :disabled="loading">确认删除</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-card-text>
    </template>

    <!-- 非简体中文语言下显示的提示信息 -->
    <template v-else>
      <v-card-title class="my-2">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-package</v-icon>
          {{ $t('app.sidebar.genshinActivities') }}
        </div>
      </v-card-title>
      <v-card-text class="text-center py-10">
        <v-icon size="64">mdi-information-box</v-icon>
        <p class="mt-4">{{ $t('app.pages.genshinActivities.languageRestriction') }}</p>
        <!-- <v-btn class="mt-4" color="primary" @click="switchToChinese">
            {{ $t('app.pages.genshinActivities.switchToChinese') }}
          </v-btn> -->
      </v-card-text>
    </template>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, reactive, shallowRef } from 'vue';
import { ActivitiesManager } from '@/utils/ActivitiesManager';
import { useI18n } from 'vue-i18n';
import { loadLanguage } from '@/i18n';
import StorageManager from '@/utils/StorageManager';

const { t, locale } = useI18n();

// 切换到简体中文
const switchToChinese = async () => {
  try {
    await loadLanguage('zh-Hans');
    StorageManager.set('userLanguage', 'zh-Hans');
    locale.value = 'zh-Hans';
  } catch (error) {
    console.error('切换到简体中文失败:', error);
  }
};

// 预置活动元数据
const activityMetadata = {
  "effigy": {
    "name": "无相交响诗",
    "version": "1.2",
    "no_data": true,
    "icon": "mdi-fire"
  },
  "mechanicus": {
    "name": "机关棋谭（v1.3海灯节，存疑）",
    "version": "1.3",
    "no_data": true,
    "icon": "mdi-chess-rook"
  },
  "fleur_fair": {
    "name": "风花的邀约",
    "version": "1.4",
    "not_shown": true,
    "icon": "mdi-flower"
  },
  "channeller_slab": {
    "name": "导能原盘·绪论",
    "version": "1.5",
    "icon": "mdi-cog"
  },
  "martial_legend": {
    "name": "风来人剑斗绮谭",
    "version": "1.6",
    "icon": "mdi-sword-cross"
  },
  "chess": {
    "name": "机关棋谭·灵妙之局",
    "version": "2.0",
    "icon": "mdi-chess-knight"
  },
  "sumo": {
    "name": "百人一揆 第一期 v2.1",
    "version": "2.1",
    "icon": "mdi-account-group"
  },
  "rogue": {
    "name": "谜境悬兵",
    "version": "2.2",
    "icon": "mdi-map-marker-question"
  },
  "channeller_slab_copy": {
    "name": "导能原盘·跋尾",
    "version": "2.3",
    "icon": "mdi-cog-transfer"
  },
  "potion": {
    "name": "魔药研析",
    "version": "2.4",
    "icon": "mdi-flask"
  },
  "sumo_second": {
    "name": "百人一揆 第二期 v2.5",
    "version": "2.5",
    "icon": "mdi-account-group"
  },
  "crystal": {
    "name": "振晶的研究",
    "version": "2.6",
    "icon": "mdi-crystal-ball"
  },
  "perilous": {
    "name": "危途疑踪",
    "version": "2.7",
    "icon": "mdi-image-filter-hdr"
  },
  "summer_v2": {
    "name": "远海诗夏游纪",
    "version": "2.8",
    "icon": "mdi-beach"
  },
  "spray": {
    "name": "片剂深研",
    "version": "3.0",
    "icon": "mdi-spray"
  },
  "sumo_third": {
    "name": "百人一揆 第三期 v3.1",
    "version": "3.1",
    "icon": "mdi-account-group"
  },
  "fungus": {
    "name": "智巧灵蕈大竞逐",
    "version": "3.2",
    "icon": "mdi-mushroom"
  },
  "mist_trial": {
    "name": "迷城战线·沙域篇",
    "version": "3.3",
    "icon": "mdi-map-search"
  },
  "lantern_v3": {
    "name": "磬弦奏华夜",
    "version": "3.4",
    "icon": "mdi-firework"
  },
  "music": {
    "name": "风花的呼吸",
    "version": "3.5",
    "icon": "mdi-music"
  },
  "crystal_v2": {
    "name": "振晶的复核实验",
    "version": "3.5",
    "icon": "mdi-crystal-ball"
  },
  "spray_v2": {
    "name": "合剂演进",
    "version": "3.6",
    "icon": "mdi-spray-bottle"
  },
  "martial_legend_v2": {
    "name": "离垢者肃心旅宴",
    "version": "3.7",
    "icon": "mdi-sword"
  },
  "penumbra_adventure": {
    "name": "清夏！乐园？大秘境！",
    "version": "3.8",
    "not_shown": true,
    "icon": "mdi-palm-tree"
  },
  "toy_battle": {
    "name": "机枢巧物前哨战",
    "version": "4.0",
    "icon": "mdi-robot"
  },
  "poetry_festival": {
    "name": "游水酝诗籍",
    "version": "4.1",
    "icon": "mdi-book-open-variant"
  },
  "mist_trial_v2": {
    "name": "迷城战线·水境篇",
    "version": "4.2",
    "icon": "mdi-map-search"
  },
  "goal_challenge": {
    "name": "深念锐意旋步舞",
    "version": "4.3",
    "icon": "mdi-dance-ballroom"
  },
  "lantern_v4": {
    "name": "彩鹞栉春风",
    "version": "4.4",
    "icon": "mdi-firework"
  },
  "alchemy_sim": {
    "name": "升炼研巧万策金",
    "version": "4.5",
    "icon": "mdi-flask-round-bottom"
  },
  "martial_legend_v3": {
    "name": "殊形之龙参寻战记",
    "version": "4.6",
    "icon": "mdi-paw"
  },
  "crystal_v3": {
    "name": "振晶的应用研究",
    "version": "4.6",
    "not_shown": true,
    "icon": "mdi-crystal-ball"
  },
  "monster_vs_monster": {
    "name": "安固诸方之述演",
    "version": "4.7",
    "icon": "mdi-ghost"
  },
  "fairy_tales": {
    "name": "欢夏！邪龙？童话国！",
    "version": "4.8",
    "icon": "mdi-castle"
  },
  "gain_buff": {
    "name": "荆棘与勋冠",
    "version": "5.0",
    "icon": "mdi-crown"
  },
  "activity_ceremony": {
    "name": "暝视寻灵织卷",
    "version": "5.2",
    "icon": "mdi-eye"
  }
};

// 响应式数据
const loading = ref(false);
const activities = ref({});
const fileInput = ref(null);

// API请求格式数据
const apiRequestFormat = {
  "headers": {
    "x-rpc-device_fp": "（米游社device_fp）",
    "Cookie": "（米游社cookie）"
  },
  "method": "GET",
  "url": "https://api-takumi-record.mihoyo.com/game_record/app/genshin/api/activities?server=cn_gf01&role_id=（原神的uid）"
};

// 添加复制功能相关的响应式变量和计算属性
const copySuccess = ref(false);

// 计算属性：Windows脚本命令
const windowsScript = computed(() => {
  const domain = window.location.hostname;
  return `irm -useb "https://${domain}/import-scripts/wuicc-genshin-act-import.ps1" | iex`;
});

// 复制到剪贴板的方法
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    copySuccess.value = true;
    // 1.5秒后恢复原始状态
    setTimeout(() => {
      copySuccess.value = false;
    }, 1500);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
};
const showActivityDetail = ref(false);
const currentActivityId = ref(null);
const currentActivityData = ref(null);
const deleteConfirmDialog = ref(false);

// 动态加载活动组件
const loadActivityComponent = async (activityId) => {
  try {
    // 根据活动ID动态导入对应的组件
    const component = await import(`@/components/GenshinActivities/${activityId}.vue`);
    return component.default;
  } catch (error) {
    console.warn(`活动组件 ${activityId}.vue 加载失败:`, error);
    return null;
  }
};

// 支持的活动组件列表（用于判断是否支持）
const supportedActivitiesList = [
  'channeller_slab', 'channeller_slab_copy', 'fleur_fair', 'martial_legend',
  'chess', 'sumo', 'sumo_second', 'sumo_third', 'rogue', 'potion',
  'crystal', 'crystal_v2', 'crystal_v3', 'perilous', 'summer_v2',
  'spray', 'spray_v2', 'fungus', 'mist_trial', 'mist_trial_v2',
  'lantern_v3', 'music', 'martial_legend_v2', 'martial_legend_v3',
  'penumbra_adventure', 'toy_battle', 'poetry_festival', 'goal_challenge',
  'lantern_v4', 'alchemy_sim', 'monster_vs_monster', 'fairy_tales',
  'gain_buff', 'activity_ceremony'
];

// 当前活动组件 - 使用shallowRef避免不必要的响应式转换
const currentActivityComponent = shallowRef(null);

// 上传状态
const uploadStatus = reactive({
  show: false,
  type: 'info',
  message: '',
  retry: false,
  retryCallback: null
});

// 活动管理器实例
const activitiesManager = new ActivitiesManager();

// 计算属性
const currentActivityTitle = computed(() => {
  if (!currentActivityData.value || !currentActivityId.value) return '';
  return getActivityTitle(currentActivityData.value, currentActivityId.value);
});

// 比较版本号（降序排序）
const compareVersions = (a, b) => {
  const versionA = getMetadata(a[0])?.version || '0';
  const versionB = getMetadata(b[0])?.version || '0';

  // 将版本号字符串转换为数字数组进行比较
  const partsA = versionA.split('.').map(part => {
    const num = parseInt(part);
    return isNaN(num) ? 0 : num;
  });
  const partsB = versionB.split('.').map(part => {
    const num = parseInt(part);
    return isNaN(num) ? 0 : num;
  });

  // 比较主版本号、次版本号等
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;

    if (partA !== partB) {
      return partB - partA; // 降序排序
    }
  }

  return 0;
};

// 已支持的活动
const supportedActivities = computed(() => {
  const supported = Object.entries(activities.value).filter(([activityId, activity]) => {
    return isActivitySupported(activityId);
  });

  // 按版本号降序排序
  supported.sort(compareVersions);

  // 转换为对象格式
  return Object.fromEntries(supported);
});

// 未支持的活动
const unsupportedActivities = computed(() => {
  const unsupported = Object.entries(activities.value).filter(([activityId, activity]) => {
    return !isActivitySupported(activityId);
  });

  // 按版本号降序排序
  unsupported.sort(compareVersions);

  // 转换为对象格式
  return Object.fromEntries(unsupported);
});

const currentActivityTime = computed(() => {
  if (!currentActivityData.value) return '';
  return formatActivityTime(currentActivityData.value);
});

const isCurrentActivitySupported = computed(() => {
  return isActivitySupported(currentActivityId.value);
});

// 方法
const initDB = async () => {
  return await activitiesManager.initDB();
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  loading.value = true;
  uploadStatus.show = false;

  try {
    const content = await readFileContent(file);
    const data = JSON.parse(content);

    // 验证数据格式
    if (!validateActivitiesData(data)) {
      throw new Error('无效的活动数据格式');
    }

    // 导入数据
    // 生成一个简单的元数据
    const metadata = {
      source: file.name,
      importDate: new Date().toISOString(),
      fileSize: file.size
    };

    // 直接传递整个数据对象给importActivitiesData，内部会处理数据结构
    const success = await activitiesManager.importActivitiesData(metadata, data);

    if (success) {
      // showUploadStatus('活动数据上传成功', 'success');
      await loadActivities();
    } else {
      throw new Error('导入活动数据失败');
    }
  } catch (error) {
    console.error('文件处理失败:', error);
    showUploadStatus(`文件处理失败: ${error.message}`, 'error');
  } finally {
    loading.value = false;
    // 重置文件输入，以便可以再次选择同一个文件
    event.target.value = '';
  }
};

const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
};

const validateActivitiesData = (data) => {
  // 基本验证：确保数据是对象
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  // 检查是否是API响应格式（包含retcode、message、data）
  if (data.retcode !== undefined && data.data && typeof data.data === 'object') {
    // 只验证data.activities数组，忽略其他活动数据
    const hasValidActivities = data.data.activities &&
      Array.isArray(data.data.activities) &&
      data.data.activities.length > 0;

    return hasValidActivities;
  }

  // 不接受直接的活动数据对象，只接受完整的API响应格式
  return false;
};

const showUploadStatus = (message, type = 'info', retry = false, retryCallback = null) => {
  uploadStatus.show = true;
  uploadStatus.type = type;
  uploadStatus.message = message;
  uploadStatus.retry = retry;
  uploadStatus.retryCallback = retryCallback;
};

const loadActivities = async (showLoading = false) => {
  if (showLoading) {
    loading.value = true;
  }

  try {
    const allActivities = await activitiesManager.getAllActivities();
    activities.value = allActivities;
  } catch (error) {
    console.error('加载活动数据失败:', error);
    showUploadStatus('加载活动数据失败', 'error');
  } finally {
    if (showLoading) {
      loading.value = false;
    }
  }
};

const confirmDeleteData = () => {
  deleteConfirmDialog.value = true;
};

const deleteAllData = async () => {
  loading.value = true;
  try {
    await activitiesManager.deleteAllActivities();
    activities.value = {};
    deleteConfirmDialog.value = false;
    showUploadStatus('所有活动数据已删除', 'success');
  } catch (error) {
    console.error('删除数据失败:', error);
    showUploadStatus('删除数据失败', 'error');
  } finally {
    loading.value = false;
  }
};

const isActivitySupported = (activityId) => {
  return supportedActivitiesList.includes(activityId);
};

// 获取活动元数据
const getMetadata = (activityId) => {
  return activityMetadata[activityId] || {};
};

const getActivityTitle = (activity, activityId) => {
  // 优先使用元数据中的名称
  if (getMetadata(activityId).name) {
    return getMetadata(activityId).name;
  }

  // 尝试从活动数据中获取标题
  if (activity.name || activity.title) {
    return activity.name || activity.title;
  }

  // 如果没有标题，使用活动ID的格式化版本
  return formatActivityIdToTitle(activityId);
};

const formatActivityIdToTitle = (activityId) => {
  // 将下划线分隔的ID转换为标题格式
  return activityId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatActivityTime = (activity) => {
  // 尝试从不同可能的位置获取时间信息
  const timeInfo =
    activity.time_info ||
    activity.times ||
    activity;

  if (timeInfo.start_time && timeInfo.end_time) {
    try {
      const startTime = new Date(Number(timeInfo.start_time) * 1000);
      const endTime = new Date(Number(timeInfo.end_time) * 1000);

      if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        return `${formatDate(startTime)} ~ ${formatDate(endTime)}`;
      }
    } catch (e) {
      // 时间格式化失败，返回空
    }
  }

  return '时间未知';
};

const getActivitySummary = (activity, activityId) => {
  // 添加版本信息
  const version = getMetadata(activityId).version ? `版本: ${getMetadata(activityId).version}` : '';

  // 为不同类型的活动提供不同的摘要信息
  let dataInfo = '';
  if (getMetadata(activityId).no_data) {
    dataInfo = '暂无数据';
  }
  //  else if (activity.total_score !== undefined) {
  //   dataInfo = `总分数: ${activity.total_score}, 参与次数: ${activity.total_times || 0}`;
  // } else if (activity.fleur_fair_gallery) {
  //   const gallery = activity.fleur_fair_gallery;
  //   dataInfo = `画廊总分数: ${gallery.total_score || 0}, 参与次数: ${gallery.total_times || 0}`;
  // }

  return version && dataInfo ? `${version}, ${dataInfo}` : version || dataInfo || `活动ID: ${activityId}`;
};

const selectActivity = async (activityId) => {
  currentActivityId.value = activityId;

  try {
    // 加载活动数据
    const activityData = await activitiesManager.getActivity(activityId);
    currentActivityData.value = activityData;

    // 如果活动支持，动态加载组件
    if (isActivitySupported(activityId)) {
      const component = await loadActivityComponent(activityId);
      currentActivityComponent.value = component;
    }

    // 显示对话框
    showActivityDetail.value = true;
  } catch (error) {
    console.error('加载活动详情失败:', error);
    showUploadStatus('加载活动详情失败', 'error');
  }
};

const closeActivityDetail = () => {
  showActivityDetail.value = false;

  // 使用setTimeout确保在弹窗关闭动画完成后才清空数据
  // 避免在关闭过程中显示"暂未支持"的提示
  setTimeout(() => {
    currentActivityId.value = null;
    currentActivityData.value = null;
    currentActivityComponent.value = null;
  }, 300); // 300ms是Vuetify对话框的默认动画时长
};

// 预加载组件方法已移除，改为按需动态加载

// 页面加载时初始化
onMounted(async () => {
  loading.value = true;

  // 初始化数据库
  const dbInitialized = await initDB();

  if (dbInitialized) {
    // 快速检查数据是否存在
    const dataExists = await activitiesManager.hasData();

    // 只有在确认数据存在的情况下才加载活动列表
    if (dataExists) {
      await loadActivities();
    } else {
      // 如果数据不存在，只显示提示信息
      // showUploadStatus('请上传活动数据文件', 'info');
    }
  } else {
    // 数据库初始化失败，提供用户手动重试的选项
    showUploadStatus('数据库初始化失败，请刷新页面重试', 'error');
    uploadStatus.retry = true;
    uploadStatus.retryCallback = async () => {
      const success = await initDB();
      if (success) {
        await loadActivities();
      }
    };
  }

  loading.value = false;
});
</script>

<style scoped>
.genshin-activities-container {
  max-width: 1200px;
  margin: 0 auto;
}

.v-card {
  border-radius: 16px;
}

:deep(.v-expansion-panel) {
  border-radius: 16px;
}

/* 为活动卡片添加悬停效果 */
.cursor-pointer {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cursor-pointer:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.hover-lift {
  transition: transform 0.2s, box-shadow 0.2s;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 活动详情内容容器 */
.activity-detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

/* 活动组件容器 */
.activity-component-container {
  padding: 4px 0;
}

/* 确保弹窗标题可以换行 */
.v-card-title .text-h5 {
  white-space: normal;
  word-break: break-word;
  flex-grow: 1;
}
</style>