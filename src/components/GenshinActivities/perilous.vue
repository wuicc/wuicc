<template>
  <div class="perilous-container">
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
          <v-icon class="mr-2">mdi-treasure-chest</v-icon>
          危途疑踪
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-accent">{{ activityData.records?.length || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">挑战关卡数</div>
              </div>
            </v-col>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-secondary">{{ getTotalLevels() || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">总层数</div>
              </div>
            </v-col>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-success">{{ getTotalBuffs() || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">总buff数</div>
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
            <v-col v-for="(record, index) in activityData.records" :key="index" cols="12">
              <v-card class="h-100" variant="outlined" hover>
                <!-- 挑战头部信息 -->
                <v-card-title class="d-flex align-center justify-space-between">
                  <div class="text-subtitle-1 font-weight-bold">{{ record.name }}</div>
                  <div class="d-flex align-center mt-1 text-subtitle-1 ">
                    最佳战果
                    <v-chip size="small" :color="getDifficultyColor(record.difficulty_id)" variant="tonal" class="mx-2">
                      {{ getDifficultyText(record.difficulty_id) }}
                    </v-chip>
                    <v-chip v-if="record.cost_time_seconds" size="small" color="info" variant="tonal">
                      {{ formatTime(record.cost_time_seconds) }}
                    </v-chip>
                  </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 层数列表 -->
                  <div class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">层数配置</div>
                    <v-row>
                      <v-col v-for="(level, levelIndex) in record.Levels" :key="levelIndex" cols="12" md="6" lg="4">
                        <v-card variant="outlined" class="h-100">
                          <v-card-title class="text-subtitle-2">
                            第 {{ levelIndex + 1 }} 层
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>
                            <!-- 角色信息 -->
                            <div class="mb-3">
                              <div class="text-caption font-weight-bold mb-1">出阵</div>
                              <v-row dense>
                                <v-col v-for="(avatar, avatarIndex) in level.avatars" :key="avatarIndex" cols="3">
                                  <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-1">
                                    <v-img :src="avatar.icon" :alt="`角色 ${avatar.id}`"
                                      class="rounded elevation-1 mx-auto" height="40" width="40" />
                                    <div class="text-caption mt-1 text-center">
                                      <v-chip size="x-small" :color="getRarityColor(avatar.rarity)" variant="tonal">
                                        {{ avatar.rarity }}★
                                      </v-chip>
                                    </div>
                                  </v-card>
                                </v-col>
                              </v-row>
                            </div>

                            <!-- buff信息 -->
                            <div>
                              <div class="text-caption font-weight-bold mb-1">战策</div>
                              <v-row dense>
                                <v-col v-for="(buff, buffIndex) in level.buffs" :key="buffIndex" cols="12">
                                  <v-card variant="tonal" color="accent" class="pa-1 mb-1">
                                    <div class="d-flex align-center">
                                      <v-img v-if="buff.icon" :src="buff.icon" width="24" height="24"
                                        class="mr-2 rounded-circle" style="background-color: #666;"></v-img>
                                      <div>
                                        <div class="text-caption font-weight-bold">{{ buff.name }}</div>
                                        <div class="text-caption text-medium-emphasis">{{ buff.desc }}</div>
                                      </div>
                                    </div>
                                  </v-card>
                                </v-col>
                              </v-row>
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
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
  name: 'Perilous',
  props: {
    activityData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // 格式化时间（秒转换为分:秒）
    const formatTime = (seconds) => {
      if (!seconds) return '未知'

      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}分${remainingSeconds.toString().padStart(2, '0')}秒`
    }

    // 获取难度文本
    const getDifficultyText = (difficultyId) => {
      const difficultyMap = {
        0: '简单',
        1: '普通',
        2: '困难',
        3: '至恶敌情'
      }
      return difficultyMap[difficultyId] || `难度${difficultyId}`
    }

    // 获取难度对应的颜色
    const getDifficultyColor = (difficultyId) => {
      const colorMap = {
        0: 'success',
        1: 'warning',
        2: 'error',
        3: 'error'
      }
      return colorMap[difficultyId] || 'grey'
    }

    // 获取稀有度对应的颜色
    const getRarityColor = (rarity) => {
      const colorMap = {
        4: 'purple',
        5: 'orange'
      }
      return colorMap[rarity] || 'grey'
    }

    // 计算总层数
    const getTotalLevels = () => {
      if (!props.activityData?.records) return 0

      return props.activityData.records.reduce((total, record) => {
        return total + (record.Levels?.length || 0)
      }, 0)
    }

    // 计算总buff数
    const getTotalBuffs = () => {
      if (!props.activityData?.records) return 0

      return props.activityData.records.reduce((total, record) => {
        if (!record.Levels) return total

        return total + record.Levels.reduce((levelTotal, level) => {
          return levelTotal + (level.buffs?.length || 0)
        }, 0)
      }, 0)
    }

    return {
      formatTime,
      getDifficultyText,
      getDifficultyColor,
      getRarityColor,
      getTotalLevels,
      getTotalBuffs
    }
  }
}
</script>

<style scoped>
.perilous-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.h-100 {
  height: 100%;
}
</style>