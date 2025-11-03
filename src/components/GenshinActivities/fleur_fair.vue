<template>
  <div class="fleur-fair-container">
    <!-- 加载状态 -->
    <v-card v-if="!activityData" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-loading</v-icon>
      <div class="text-h6 text-grey mt-4">加载中...</div>
    </v-card>

    <!-- 活动详情 -->
    <div v-else>
      <!-- 画廊部分 -->
      <v-card v-if="activityData.fleur_fair_gallery && activityData.fleur_fair_gallery.exists_data" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-image-multiple</v-icon>
          风花节画廊
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <!-- 基本信息卡片 -->
          <v-card variant="tonal" color="accent" class="mb-4">
            <v-card-text>
              <v-row>
                <v-col cols="6" md="4">
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold text-accent">{{ activityData.fleur_fair_gallery.total_score ||
                      0 }}</div>
                    <div class="text-caption text-medium-emphasis">累计分数</div>
                  </div>
                </v-col>
                <v-col cols="6" md="4">
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold text-secondary">{{ activityData.fleur_fair_gallery.total_times
                      || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">总挑战成功次数</div>
                  </div>
                </v-col>
                <v-col cols="6" md="4">
                  <div class="text-center">
                    <div class="text-body-2 font-weight-medium">{{
                      formatTime(activityData.fleur_fair_gallery.start_time) }}</div>
                    <div class="text-body-2 font-weight-medium">{{ formatTime(activityData.fleur_fair_gallery.end_time)
                      }}</div>
                    <div class="text-caption text-medium-emphasis">统计周期</div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- 游戏分类 -->
          <v-row>
            <v-col v-for="category in activityData.fleur_fair_gallery.game_collections" :key="category.type" cols="12"
              lg="6">
              <v-card class="h-100" variant="outlined" hover>
                <v-card-title class="d-flex align-center">
                  <v-icon class="mr-2">mdi-gamepad-variant</v-icon>
                  {{ category.type }}
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <v-row>
                    <v-col v-for="game in category.games" :key="game.name" cols="6">
                      <v-card variant="flat" class="pa-3">
                        <v-card-title class="text-subtitle-1 font-weight-bold">{{ game.name }}</v-card-title>
                        <v-divider class="my-2"></v-divider>
                        <div class="game-records">
                          <div v-for="record in game.records" :key="record.difficulty"
                            class="d-flex justify-space-between align-center mb-1">
                            <v-chip size="small" :color="getDifficultyColor(record.difficulty)" variant="tonal">
                              {{ getDifficultyText(record.difficulty) }}
                            </v-chip>
                            <span class="text-h6 font-weight-bold text-accent">{{ record.max_score || 0 }}</span>
                          </div>
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 副本部分 -->
      <v-card v-if="activityData.fleur_fair_dungeon" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-castle</v-icon>
          风花节副本
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <!-- 基本信息卡片 -->
          <v-card variant="tonal" color="accent" class="mb-4">
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6" md="4">
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold text-accent">{{ activityData.fleur_fair_dungeon.total_score ||
                      0 }}</div>
                    <div class="text-caption text-medium-emphasis">累计分数</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold text-secondary">{{ activityData.fleur_fair_dungeon.total_times
                      || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">总挑战成功次数</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <div class="text-center">
                    <div class="text-body-2 font-weight-medium">{{
                      formatTime(activityData.fleur_fair_dungeon.start_time) }}</div>
                    <div class="text-body-2 font-weight-medium">{{ formatTime(activityData.fleur_fair_dungeon.end_time)
                      }}</div>
                    <div class="text-caption text-medium-emphasis">统计周期</div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- 通关记录 -->
          <v-card-title class="px-0">
            <v-icon class="mr-2">mdi-trophy</v-icon>
            通关记录
          </v-card-title>
          <v-row>
            <v-col v-for="(record, index) in activityData.fleur_fair_dungeon.records" :key="index" cols="12" lg="6">
              <v-card class="h-100" variant="outlined" hover>
                <v-card-title class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">记录 {{ index + 1 }}</div>
                    <div class="text-caption text-medium-emphasis">{{ formatTime(record.settle_time) }}</div>
                  </div>
                  <v-chip color="error" variant="tonal" class="text-h6">
                    {{ record.score }}
                  </v-chip>
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
                          <div class="text-caption mt-1 text-center">等级: {{ avatar.level }}</div>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>

                  <!-- 通关阶段 -->
                  <div>
                    <div class="text-subtitle-2 font-weight-bold mb-2">通关阶段</div>
                    <div class="d-flex flex-wrap gap-2">
                      <v-chip v-for="(stage, stageIndex) in record.stage_names" :key="stageIndex" size="small"
                        color="info" variant="tonal">
                        {{ stage }}
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
  name: 'FleurFair',
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
        const seconds = String(date.getSeconds()).padStart(2, '0')

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      } catch (error) {
        console.error('时间格式化错误:', error)
        return '时间未知'
      }
    }

    // 获取难度文本
    const getDifficultyText = (difficulty) => {
      const difficultyMap = {
        0: '普通',
        1: '简单',
        2: '中等',
        3: '困难'
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
.fleur-fair-container {
  padding: 16px;
}

/* 响应式间距调整 */
@media (max-width: 960px) {
  .fleur-fair-container {
    padding: 12px;
  }
}

@media (max-width: 600px) {
  .fleur-fair-container {
    padding: 8px;
  }
}
</style>