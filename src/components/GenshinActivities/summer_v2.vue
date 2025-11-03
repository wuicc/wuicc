<template>
  <div class="summer-v2-container">
    <!-- 加载状态 -->
    <v-card v-if="!activityData" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-loading</v-icon>
      <div class="text-h6 text-grey mt-4">加载中...</div>
    </v-card>

    <!-- 活动详情 -->
    <div v-else>
      <!-- 活动基本信息卡片 -->
      <v-card class="mb-4" variant="tonal" color="accent">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-palm-tree</v-icon>
          远海诗夏游纪
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-accent">{{ activityData.way_point_number || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">解锁传送点</div>
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-secondary">{{ activityData.chest_number || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">获得宝箱数</div>
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-success">{{ activityData.anchor_number || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">解锁浪船锚点</div>
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-warning">{{ getTotalStories() || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">故事任务</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 故事任务区域 -->
      <v-card v-if="activityData.story?.records?.length" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-book-open-variant</v-icon>
          夏日回忆
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="story in activityData.story.records" :key="story.id" cols="12" md="6" lg="4">
              <v-card variant="outlined" class="h-100">
                <v-card-title class="text-subtitle-2 d-flex align-center">
                  <v-img v-if="story.icon" :src="story.icon" width="96" height="96" class="mr-2"></v-img>
                  {{ story.name }}
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="text-caption text-medium-emphasis">完成时间: {{ formatStoryTime(story.finish_time) }}</div>
                    </div>
                    <v-chip v-if="story.finished" size="small" color="success" variant="tonal">
                      已完成
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 挑战区域 -->
      <v-card v-if="activityData.challenge?.records?.length" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-sword-cross</v-icon>
          迷域探索
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="challenge in activityData.challenge.records" :key="challenge.id" cols="12" md="6" lg="3">
              <v-card variant="outlined" class="h-100">
                <v-card-title class="text-subtitle-2 d-flex align-center">
                  <v-img v-if="challenge.icon" :src="challenge.icon" width="64" height="64" class="mr-2"></v-img>
                  {{ challenge.name }}
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-accent">{{ challenge.success_num || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">成功次数</div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-secondary">{{ challenge.skill_use_num || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">技能使用次数</div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <div class="d-flex justify-space-between align-center mt-2">
                    <div class="text-caption text-medium-emphasis">
                      {{ formatStoryTime(challenge.finish_time) }}
                    </div>
                    <v-chip v-if="challenge.finished" size="small" color="success" variant="tonal">
                      已完成
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 航海记录区域 -->
      <v-card v-if="activityData.sailing?.records?.length">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-sail-boat</v-icon>
          逸速穿浪
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="sailing in activityData.sailing.records" :key="sailing.id" cols="12" md="6" lg="4">
              <v-card variant="outlined" class="h-100">
                <v-card-title class="text-subtitle-2">
                  航海任务 {{ sailing.id }}
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-accent">{{ formatCostTime(sailing.cost_time) }}</div>
                    <div class="text-caption text-medium-emphasis">耗时</div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <div class="text-center">
                    <v-chip v-if="sailing.finished" size="small" color="success" variant="tonal">
                      已完成
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SummerV2',
  props: {
    activityData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // 格式化故事时间
    const formatStoryTime = (timeObj) => {
      if (!timeObj) return '未知'
      
      const { year, month, day, hour, minute } = timeObj
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }

    // 计算总故事任务数
    const getTotalStories = () => {
      if (!props.activityData?.story?.records) return 0
      return props.activityData.story.records.length
    }

    // 计算总挑战任务数
    const getTotalChallenges = () => {
      if (!props.activityData?.challenge?.records) return 0
      return props.activityData.challenge.records.length
    }

    // 计算总航海任务数
    const getTotalSailings = () => {
      if (!props.activityData?.sailing?.records) return 0
      return props.activityData.sailing.records.length
    }

    // 格式化耗时显示为分秒格式
    const formatCostTime = (seconds) => {
      if (!seconds || seconds === 0) return '0秒'
      
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      
      if (minutes === 0) {
        return `${remainingSeconds}秒`
      } else if (remainingSeconds === 0) {
        return `${minutes}分`
      } else {
        return `${minutes}分${remainingSeconds}秒`
      }
    }

    return {
      formatStoryTime,
      getTotalStories,
      getTotalChallenges,
      getTotalSailings,
      formatCostTime
    }
  }
}
</script>

<style scoped>
.summer-v2-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.h-100 {
  height: 100%;
}
</style>