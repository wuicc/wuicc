<template>
  <div class="music-container">
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
          <v-icon class="mr-2">mdi-music</v-icon>
          音乐挑战
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-accent">{{ getTotalScore() || 0 }}</div>
                <div class="text-caption text-medium-emphasis">累计分数</div>
              </div>
            </v-col>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-secondary">{{ activityData?.data?.length || 0 }}</div>
                <div class="text-caption text-medium-emphasis">挑战曲目数</div>
              </div>
            </v-col>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-success">{{ getAverageScoreRatio() }}</div>
                <div class="text-caption text-medium-emphasis">平均得分率</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 音乐挑战记录区域 -->
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-music-note</v-icon>
          音乐挑战记录
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="record in activityData?.data || []" :key="record.music_id" cols="12">
              <v-card class="h-100" variant="outlined" hover>
                <!-- 曲目头部信息 -->
                <v-card-title class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ record.name }}</div>
                    <div class="d-flex align-center mt-1">
                      <v-chip size="small" color="info" variant="tonal" class="mr-2">
                        {{ getDifficultyText(record.level_id) }}
                      </v-chip>
                      <v-chip size="small" :color="getRankColor(record.score_rank)" variant="tonal">
                        {{ record.score_rank }}
                      </v-chip>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-h6 font-weight-bold text-error">{{ record.score || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">总分</div>
                  </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 曲目详细信息 -->
                  <v-row dense>
                    <v-col cols="4">
                      <div class="text-caption font-weight-bold">完成率</div>
                      <div class="text-body-2">{{ record.score_ratio }}</div>
                    </v-col>
                    <v-col cols="4">
                      <div class="text-caption font-weight-bold">评级</div>
                      <v-icon v-for="n in 3" :key="n"
                        :color="n <= record.star_rating ? 'yellow-darken-2' : 'grey-lighten-1'" size="small">
                        mdi-star
                      </v-icon>
                    </v-col>
                    <v-col cols="4">
                      <div class="text-caption font-weight-bold">最高连击</div>
                      <div class="text-body-2">{{ record.max_combo }}</div>
                    </v-col>
                  </v-row>
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
  name: 'Music',
  props: {
    activityData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // 计算总分数
    const getTotalScore = () => {
      if (!props.activityData?.data) return 0
      return props.activityData.data.reduce((total, record) => total + (record.score || 0), 0)
    }

    // 计算平均得分率
    const getAverageScoreRatio = () => {
      if (!props.activityData?.data || props.activityData.data.length === 0) return '0%'
      const ratios = props.activityData.data.map(record =>
        parseFloat(record.score_ratio?.replace('%', '') || 0)
      )
      const average = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length
      return average.toFixed(2) + '%'
    }

    // 获取最高分数
    const getMaxScore = () => {
      if (!props.activityData?.data) return 0
      return Math.max(...props.activityData.data.map(record => record.score || 0))
    }

    // 获取最高连击数
    const getMaxCombo = () => {
      if (!props.activityData?.data) return 0
      return Math.max(...props.activityData.data.map(record => record.max_combo || 0))
    }

    // 获取最高评级
    const getHighestRank = () => {
      if (!props.activityData?.data) return ''
      const ranks = props.activityData.data.map(record => record.score_rank)
      const rankOrder = ['高遏行云', '声动梁尘', '余音绕梁', '初试啼声']
      for (const rank of rankOrder) {
        if (ranks.includes(rank)) return rank
      }
      return ranks[0] || ''
    }

    // 获取指定星级的曲目数量
    const getStarCount = (starRating) => {
      if (!props.activityData?.data) return 0
      return props.activityData.data.filter(record => record.star_rating === starRating).length
    }

    // 获取评级对应的颜色
    const getRankColor = (rank) => {
      const rankColors = {
        '高遏行云': 'success',
        '声动梁尘': 'warning',
        '余音绕梁': 'info',
        '初试啼声': 'grey'
      }
      return rankColors[rank] || 'grey'
    }

    // 移除颜色标签
    const removeColorTags = (text) => {
      if (!text) return ''
      return text.replace(/<[^>]*>/g, '')
    }

    // 获取难度级别对应的文字描述
    const getDifficultyText = (levelId) => {
      const difficultyMap = {
        1: '简单',
        2: '普通',
        3: '大师',
      }
      return difficultyMap[levelId] || `${levelId} 难度`
    }

    return {
      getTotalScore,
      getAverageScoreRatio,
      getMaxScore,
      getMaxCombo,
      getHighestRank,
      getStarCount,
      getRankColor,
      removeColorTags,
      getDifficultyText
    }
  }
}
</script>

<style scoped>
.music-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .music-container {
    padding: 10px;
  }
}
</style>