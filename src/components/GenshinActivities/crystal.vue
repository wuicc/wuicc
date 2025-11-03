<template>
  <div class="crystal-container">
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
          <v-icon class="mr-2">mdi-crystal-ball</v-icon>
          振晶的研究
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
                <div class="text-caption text-medium-emphasis">挑战关卡数</div>
              </div>
            </v-col>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-success">{{ getTotalBuffs() || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">总振晶数</div>
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
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ record.stage_name }}</div>
                    <div class="d-flex align-center mt-1">
                      <v-chip size="small" :color="getDifficultyColor(record.difficulty)" variant="tonal" class="mr-2">
                        {{ getDifficultyText(record.difficulty) }}
                      </v-chip>
                      <v-chip size="small" color="info" variant="tonal">
                        倍率: {{ record.factor }}x
                      </v-chip>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-h6 font-weight-bold text-error">{{ record.stage_score || 0 }}
                    </div>
                    <div class="text-caption text-medium-emphasis">最高分数</div>
                    <div v-if="record.heraldry_icon" class="mt-1">
                      <v-img :src="record.heraldry_icon" width="32" height="32" class="mx-auto"></v-img>
                    </div>
                  </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 上半场阵容 -->
                  <div class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">上半场</div>
                    <v-row>
                      <v-col cols="12">
                        <v-card variant="outlined" class="h-100">
                          <v-card-title class="text-subtitle-2">
                            角色配置
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>
                            <v-row dense>
                              <v-col v-for="(avatar, avatarIndex) in record.first_half.avatars" :key="avatarIndex" cols="3">
                                <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-1">
                                  <v-img :src="avatar.icon" :alt="`角色 ${avatar.id}`" class="rounded elevation-1 mx-auto"
                                    height="40" width="40" />
                                  <div class="text-caption mt-1 text-center">
                                    <div>等级: {{ avatar.level }}</div>
                                    <v-chip v-if="avatar.is_trial" size="x-small" color="success" variant="tonal">
                                      试用
                                    </v-chip>
                                  </div>
                                </v-card>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>
                      </v-col>
                      <v-col cols="12">
                        <v-card variant="outlined" class="h-100">
                          <v-card-title class="text-subtitle-2">
                            振晶配置 ({{ record.first_half.buff_count }}个)
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>
                            <v-row dense>
                              <v-col v-for="(buff, buffIndex) in record.first_half.buffs" :key="buffIndex" cols="12" md="4">
                                <v-card variant="tonal" color="accent" class="pa-1 mb-1">
                                  <div class="d-flex align-center">
                                    <v-img v-if="buff.effect_icon" :src="buff.effect_icon" width="24" height="24" class="mr-2"></v-img>
                                    <div>
                                      <div class="text-caption font-weight-bold">效果等级: {{ buff.effect_level }}</div>
                                      <div class="text-caption text-medium-emphasis">{{ removeColorTags(buff.cond) }}</div>
                                      <div class="text-caption text-medium-emphasis">{{ removeColorTags(buff.effect) }}</div>
                                    </div>
                                  </div>
                                </v-card>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>

                  <!-- 下半场阵容 -->
                  <div class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">下半场</div>
                    <v-row>
                      <v-col cols="12">
                        <v-card variant="outlined" class="h-100">
                          <v-card-title class="text-subtitle-2">
                            角色配置
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>
                            <v-row dense>
                              <v-col v-for="(avatar, avatarIndex) in record.second_half.avatars" :key="avatarIndex" cols="3">
                                <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-1">
                                  <v-img :src="avatar.icon" :alt="`角色 ${avatar.id}`" class="rounded elevation-1 mx-auto"
                                    height="40" width="40" />
                                  <div class="text-caption mt-1 text-center">
                                    <div>等级: {{ avatar.level }}</div>
                                    <v-chip v-if="avatar.is_trial" size="x-small" color="success" variant="tonal">
                                      试用
                                    </v-chip>
                                  </div>
                                </v-card>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>
                      </v-col>
                      <v-col cols="12">
                        <v-card variant="outlined" class="h-100">
                          <v-card-title class="text-subtitle-2">
                            振晶配置 ({{ record.second_half.buff_count }}个)
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>
                            <v-row dense>
                              <v-col v-for="(buff, buffIndex) in record.second_half.buffs" :key="buffIndex" cols="12"  md="4">
                                <v-card variant="tonal" color="accent" class="pa-1 mb-1">
                                  <div class="d-flex align-center">
                                    <v-img v-if="buff.effect_icon" :src="buff.effect_icon" width="24" height="24" class="mr-2"></v-img>
                                    <div>
                                      <div class="text-caption font-weight-bold">效果等级: {{ buff.effect_level }}</div>
                                      <div class="text-caption text-medium-emphasis">{{ removeColorTags(buff.cond) }}</div>
                                      <div class="text-caption text-medium-emphasis">{{ removeColorTags(buff.effect) }}</div>
                                    </div>
                                  </div>
                                </v-card>
                              </v-col>
                            </v-row>
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
  name: 'Crystal',
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
        2: '困难',
        3: '极难'
      }
      return difficultyMap[difficulty] || `难度${difficulty}`
    }

    // 获取难度对应的颜色
    const getDifficultyColor = (difficulty) => {
      const colorMap = {
        0: 'success',
        1: 'warning',
        2: 'error',
        3: 'error'
      }
      return colorMap[difficulty] || 'grey'
    }

    // 计算总分数
    const getTotalScore = () => {
      if (!props.activityData?.records) return 0
      return props.activityData.records.reduce((total, record) => {
        return total + (record.stage_score || 0)
      }, 0)
    }

    // 计算总振晶数
    const getTotalBuffs = () => {
      if (!props.activityData?.records) return 0
      return props.activityData.records.reduce((total, record) => {
        const firstHalfBuffs = record.first_half?.buff_count || 0
        const secondHalfBuffs = record.second_half?.buff_count || 0
        return total + firstHalfBuffs + secondHalfBuffs
      }, 0)
    }

    // 移除颜色标签
    const removeColorTags = (text) => {
      if (!text) return ''
      return text
        .replace(/<c\d+>/g, '')
        .replace(/<\/c\d+>/g, '')
        .replace(/\\n/g, ' ')
    }

    return {
      formatTime,
      getDifficultyText,
      getDifficultyColor,
      getTotalScore,
      getTotalBuffs,
      removeColorTags
    }
  }
}
</script>

<style scoped>
.crystal-container {
  padding: 8px;
}

.h-100 {
  height: 100%;
}

.text-caption {
  font-size: 0.75rem;
}

.text-subtitle-2 {
  font-size: 0.875rem;
  font-weight: 600;
}

.v-card {
  transition: box-shadow 0.3s ease;
}

.v-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.v-chip {
  font-size: 0.7rem;
}

.v-img {
  object-fit: cover;
}
</style>