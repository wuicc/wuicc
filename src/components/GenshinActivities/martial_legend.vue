<template>
  <div class="martial-legend-container">
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
          <v-icon class="mr-2">mdi-sword-cross</v-icon>
          武斗传奇
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-accent">{{ activityData.total_score || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">累计分数</div>
              </div>
            </v-col>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-secondary">{{ activityData.total_times || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">总挑战成功次数</div>
              </div>
            </v-col>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-body-2 font-weight-medium">{{ formatTime(activityData.start_time) }}
                </div>
                <div class="text-body-2 font-weight-medium">{{ formatTime(activityData.end_time) }}
                </div>
                <div class="text-caption text-medium-emphasis">统计周期</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 挑战记录区域 -->
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-trophy</v-icon>
          挑战记录
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="(record, index) in activityData.records" :key="record.challenge_id" cols="12">
              <v-card class="h-100" variant="outlined" hover>
                <!-- 挑战头部信息 -->
                <v-card-title class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ record.challenge_name }}</div>
                    <div class="d-flex align-center mt-1">
                      <v-chip size="small" :color="getDifficultyColor(record.difficulty)" variant="tonal" class="mr-2">
                        {{ getDifficultyText(record.difficulty) }}
                      </v-chip>
                      <v-chip v-if="record.is_multiplayer_online" size="small" color="success" variant="tonal">
                        多人模式
                      </v-chip>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-h6 font-weight-bold text-error">{{ record.max_score || 0 }}
                    </div>
                    <div class="text-caption text-medium-emphasis">最高分数</div>
                    <div class="text-body-2 font-weight-medium text-info">{{ record.score_multiple
                    }}x 倍率</div>
                  </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 使用角色 -->
                  <div class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">使用角色</div>
                    <v-row dense>
                      <v-col v-for="(avatar, avatarIndex) in record.avatars" :key="avatarIndex" cols="4" sm="3">
                        <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-2">
                          <v-img :src="avatar.icon" :alt="`角色 ${avatar.id}`" class="rounded elevation-2 mx-auto"
                            height="60" width="60" />
                          <div class="text-caption mt-1 text-center">等级: {{ avatar.level }}
                          </div>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>

                  <!-- 限制条件 -->
                  <div class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">限制条件</div>
                    <v-row dense>
                      <v-col v-for="(condition, condIndex) in record.limit_conditions" :key="condIndex" cols="12">
                        <v-card variant="tonal" color="warning" class="pa-2">
                          <div class="d-flex align-center justify-space-between">
                            <span class="text-body-2" style="max-width: 90%;">{{ condition.desc }}</span>
                            <v-chip size="small" color="warning" variant="flat">
                              +{{ condition.score }}分
                            </v-chip>
                          </div>
                        </v-card>
                      </v-col>
                    </v-row>
                    <div class="text-right mt-2">
                      <v-chip color="error" variant="tonal">
                        条件总分: {{ calculateConditionsTotal(record.limit_conditions) }}
                      </v-chip>
                    </div>
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
  name: 'MartialLegend',
  props: {
    activityData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // 格式化时间戳
    const formatTime = (timestamp) => {
      if (!timestamp) return '未知'

      try {
        const date = new Date(Number(timestamp) * 1000)
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          return '时间格式错误'
        }

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')

        return `${year}-${month}-${day} ${hours}:${minutes}`
      } catch (error) {
        console.error('时间格式化错误:', error)
        return '时间未知'
      }
    }

    // 获取难度文本
    const getDifficultyText = (difficulty) => {
      const difficultyMap = {
        0: '简单',
        1: '普通',
        2: '困难'
      }
      return difficultyMap[difficulty] || `难度${difficulty}`
    }

    // 获取难度对应的颜色
    const getDifficultyColor = (difficulty) => {
      const colorMap = {
        0: 'success',
        1: 'warning',
        2: 'error'
      }
      return colorMap[difficulty] || 'grey'
    }

    // 计算限制条件总分
    const calculateConditionsTotal = (conditions) => {
      if (!conditions || !Array.isArray(conditions)) return 0
      return conditions.reduce((total, condition) => total + (condition.score || 0), 0)
    }

    return {
      formatTime,
      getDifficultyText,
      getDifficultyColor,
      calculateConditionsTotal
    }
  }
}
</script>

<style scoped>
.martial-legend-container {
  padding: 16px;
}

/* 响应式间距调整 */
@media (max-width: 960px) {
  .martial-legend-container {
    padding: 12px;
  }
}

@media (max-width: 600px) {
  .martial-legend-container {
    padding: 8px;
  }
}
</style>