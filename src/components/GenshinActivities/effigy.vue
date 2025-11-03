<template>
  <div class="effigy-container">
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
          <v-icon class="mr-2">mdi-fire</v-icon>
          无相交响诗
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="6" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-accent">{{ activityData.total_score || 0 }}</div>
                <div class="text-caption text-medium-emphasis">累计分数</div>
              </div>
            </v-col>
            <v-col cols="6" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-secondary">{{ activityData.total_times || 0 }}</div>
                <div class="text-caption text-medium-emphasis">总挑战次数</div>
              </div>
            </v-col>
            <v-col cols="6" md="3">
              <div class="text-center">
                <div class="text-body-2 font-weight-medium">{{ formatTime(activityData.start_time) }}</div>
                <div class="text-body-2 font-weight-medium">{{ formatTime(activityData.end_time) }}</div>
                <div class="text-caption text-medium-emphasis">活动时间</div>
              </div>
            </v-col>
            <v-col cols="6" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold" :class="activityData.exists_data ? 'text-success' : 'text-grey'">
                  {{ activityData.exists_data ? '有数据' : '无数据' }}
                </div>
                <div class="text-caption text-medium-emphasis">数据状态</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 挑战记录区域 -->
      <v-card v-if="activityData.records && activityData.records.length > 0">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-trophy</v-icon>
          挑战记录
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="(record, index) in activityData.records" :key="index" cols="12" lg="6">
              <v-card class="h-100" variant="outlined" hover>
                <!-- 挑战头部信息 -->
                <v-card-title class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ record.challenge_name || `挑战 ${index + 1}` }}</div>
                    <div class="d-flex align-center mt-1">
                      <v-chip size="small" :color="getDifficultyColor(record.difficulty)" variant="tonal" class="mr-2">
                        {{ getDifficultyText(record.difficulty) }}
                      </v-chip>
                      <v-chip v-if="record.score" size="small" color="success" variant="tonal">
                        分数: {{ record.score }}
                      </v-chip>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-h6 font-weight-bold text-error">{{ record.max_score || record.score || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">最高分数</div>
                  </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 挑战详情 -->
                  <div class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">挑战详情</div>
                    <v-row dense>
                      <v-col cols="6">
                        <div class="text-body-2">完成时间: {{ formatTime(record.complete_time) }}</div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-body-2">挑战次数: {{ record.times || 1 }}</div>
                      </v-col>
                    </v-row>
                  </div>

                  <!-- 使用角色 -->
                  <div v-if="record.avatars && record.avatars.length > 0" class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">使用角色</div>
                    <v-row dense>
                      <v-col v-for="(avatar, avatarIndex) in record.avatars" :key="avatarIndex" cols="4" sm="3">
                        <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-2">
                          <v-img v-if="avatar.icon" :src="avatar.icon" :alt="`角色 ${avatar.id}`" 
                                 class="rounded elevation-2 mx-auto" height="60" width="60" />
                          <v-icon v-else size="48" color="grey">mdi-account</v-icon>
                          <div class="text-caption mt-1 text-center">等级: {{ avatar.level || '未知' }}</div>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>

                  <!-- 限制条件 -->
                  <div v-if="record.conditions && record.conditions.length > 0" class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">限制条件</div>
                    <v-row dense>
                      <v-col v-for="(condition, condIndex) in record.conditions" :key="condIndex" cols="12">
                        <v-card variant="tonal" color="warning" class="pa-2">
                          <div class="d-flex align-center justify-space-between">
                            <span class="text-body-2" style="max-width: 80%;">{{ condition.desc || `条件 ${condIndex + 1}` }}</span>
                            <v-chip size="small" color="warning" variant="flat">
                              +{{ condition.score || 0 }}分
                            </v-chip>
                          </div>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>

                  <!-- 增益效果 -->
                  <div v-if="record.buffs && record.buffs.length > 0" class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">增益效果</div>
                    <div class="d-flex flex-wrap gap-2">
                      <v-chip v-for="(buff, buffIndex) in record.buffs" :key="buffIndex" size="small" color="info"
                              variant="tonal">
                        {{ buff.desc || `增益 ${buffIndex + 1}` }}
                      </v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 无数据提示 -->
      <v-card v-else class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-information-outline</v-icon>
        <div class="text-h6 text-grey mt-4">暂无挑战记录</div>
        <div class="text-body-1 text-grey mt-2">该活动暂无挑战数据记录</div>
      </v-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Effigy',
  props: {
    activityData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // 格式化时间戳
    const formatTime = (timestamp) => {
      if (!timestamp || timestamp === "0") return '未知'

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
        2: '困难',
        3: '极难'
      }
      return difficultyMap[difficulty] || `难度${difficulty}`
    }

    // 获取难度对应的颜色
    const getDifficultyColor = (difficulty) => {
      const colorMap = {
        0: 'grey',
        1: 'success',
        2: 'warning',
        3: 'error'
      }
      return colorMap[difficulty] || 'grey'
    }

    return {
      formatTime,
      getDifficultyText,
      getDifficultyColor
    }
  }
}
</script>

<style scoped>
.effigy-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.v-card {
  border-radius: 12px;
}

.v-card-title {
  padding: 16px 20px;
}

.v-card-text {
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 960px) {
  .effigy-container {
    padding: 16px;
  }
  
  .v-card-text {
    padding: 16px;
  }
}

@media (max-width: 600px) {
  .effigy-container {
    padding: 12px;
  }
  
  .v-card-title {
    padding: 12px 16px;
  }
  
  .v-card-text {
    padding: 12px;
  }
}
</style>