<template>
  <div class="potion-container">
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
          <v-icon class="mr-2">mdi-flask</v-icon>
          魔药研析
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-accent">{{ getTotalScore() || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">累计分数</div>
              </div>
            </v-col>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-secondary">{{ activityData.records?.length || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">挑战阶段数</div>
              </div>
            </v-col>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-success">{{ getTotalLevels() || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">总层级数</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 阶段记录区域 -->
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-trophy</v-icon>
          阶段记录
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="(record, index) in activityData.records" :key="index" cols="12">
              <v-card class="h-100" variant="outlined" hover>
                <!-- 阶段头部信息 -->
                <v-card-title class="d-flex align-center justify-space-between">
                  <div class="text-subtitle-1 font-weight-bold">{{ record.stage_name }}</div>
                  <div class="d-flex align-center mt-1">
                    <v-chip size="small" color="info" variant="tonal" class="mr-2">
                      当前最高分数: {{ record.stage_score || 0 }}
                    </v-chip>
                    <v-chip v-if="record.finished" size="small" color="success" variant="tonal">
                      已完成
                    </v-chip>
                  </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 层级列表 -->
                  <div class="mb-4">
                    <v-row>
                      <v-col v-for="(level, levelIndex) in record.levels" :key="levelIndex" cols="12" md="6">
                        <v-card variant="outlined" class="h-100">
                          <v-card-title class="text-subtitle-2">
                            {{ level.level_name }}
                            <v-chip size="small" :color="getDifficultyColor(level.difficulty)" variant="tonal">
                              {{ getDifficultyText(level.difficulty) }}
                            </v-chip>
                            <div class="float-right ">
                              <span class="text-medium-emphasis">得分 </span>
                              <span class="font-weight-bold text-error">{{ level.score || 0 }}</span>
                            </div>
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>

                            <!-- 角色信息 -->
                            <div class="mb-3">
                              <div class="text-caption font-weight-bold mb-1">角色</div>
                              <v-row dense>
                                <v-col v-for="(avatar, avatarIndex) in level.avatars" :key="avatarIndex" cols="3">
                                  <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-1">
                                    <v-img :src="avatar.icon" :alt="`角色 ${avatar.id}`"
                                      class="rounded elevation-1 mx-auto" height="40" width="40" />
                                    <div class="text-caption mt-1 text-center">
                                      <div>等级: {{ avatar.level }}</div>
                                      <v-chip v-if="avatar.is_trial" size="x-small" color="success" variant="tonal">
                                        试用
                                      </v-chip>
                                    </div>
                                  </v-card>
                                </v-col>
                              </v-row>
                            </div>

                            <!-- 增益效果信息 -->
                            <div>
                              <div class="text-caption font-weight-bold mb-1">增益效果</div>
                              <v-row dense>
                                <v-col v-for="(buff, buffIndex) in level.buffs" :key="buffIndex" cols="12">
                                  <v-card variant="tonal" :color="getBuffQualityColor(buff.quality)" class="pa-1 mb-1">
                                    <div class="d-flex align-center">
                                      <v-img v-if="buff.icon" :src="buff.icon" width="24" height="24" class="mr-2"
                                        max-width="24"></v-img>
                                      <div>
                                        <div class="text-caption font-weight-bold">{{ buff.name }}</div>
                                        <div class="text-caption text-medium-emphasis">{{ removeColorTags(buff.desc) }}
                                        </div>
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
  name: 'Potion',
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
          return '无效时间'
        }
        return date.toLocaleString('zh-CN')
      } catch (error) {
        console.error('时间格式化错误:', error)
        return '时间错误'
      }
    }

    // 获取难度文本
    const getDifficultyText = (difficulty) => {
      const difficultyMap = {
        1: '简单',
        2: '普通',
        3: '困难',
        4: '极难'
      }
      return difficultyMap[difficulty] || `难度 ${difficulty}`
    }

    // 获取难度颜色
    const getDifficultyColor = (difficulty) => {
      const colorMap = {
        1: 'success',
        2: 'info',
        3: 'warning',
        4: 'error'
      }
      return colorMap[difficulty] || 'grey'
    }

    // 获取增益效果品质颜色
    const getBuffQualityColor = (quality) => {
      const colorMap = {
        4: 'accent',
        5: 'success'
      }
      return colorMap[quality] || 'grey'
    }

    // 计算总分数
    const getTotalScore = () => {
      if (!props.activityData?.records) return 0
      return props.activityData.records.reduce((total, record) => total + (record.stage_score || 0), 0)
    }

    // 计算总层级数
    const getTotalLevels = () => {
      if (!props.activityData?.records) return 0
      return props.activityData.records.reduce((total, record) => total + (record.levels?.length || 0), 0)
    }

    // 获取阶段层级数量
    const getStageLevelCount = (record) => {
      return record.levels?.length || 0
    }

    // 移除HTML颜色标签
    const removeColorTags = (text) => {
      if (!text) return ''
      return text.replace(/<color=#[0-9a-fA-F]+>/g, '').replace(/<\/color>/g, '')
    }

    return {
      formatTime,
      getDifficultyText,
      getDifficultyColor,
      getBuffQualityColor,
      getTotalScore,
      getTotalLevels,
      getStageLevelCount,
      removeColorTags
    }
  }
}
</script>

<style scoped>
.potion-container {
  padding: 16px;
}

/* 响应式间距调整 */
@media (max-width: 960px) {
  .potion-container {
    padding: 12px;
  }
}

@media (max-width: 600px) {
  .potion-container {
    padding: 8px;
  }
}
</style>