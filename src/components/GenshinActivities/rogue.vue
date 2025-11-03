<template>
  <div class="rogue-container">
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
          谜境悬兵
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-accent">{{ getTotalChallenges() || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">总挑战数</div>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-secondary">{{ getPassedChallenges() || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">通过挑战数</div>
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
                  <div class="text-subtitle-1 font-weight-bold">{{ record.challenge_name }}</div>
                  <div>
                    <v-chip size="small" :color="getPassedColor(record.is_passed)" variant="tonal" class="mr-2">
                      {{ record.is_passed ? '试炼完成' : '试炼未通过' }}
                    </v-chip>
                    <v-chip size="small" color="info" variant="tonal">
                      最大层数 第 {{ record.settled_level || '未知' }} 层阁
                    </v-chip>
                  </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 角色阵容 -->
                  <div class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">角色阵容</div>
                    <v-row>
                      <!-- 主要角色 -->
                      <v-col cols="12" md="6">
                        <v-card variant="outlined" class="h-100">
                          <v-card-title class="text-subtitle-2">
                            主要角色
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>
                            <v-row dense>
                              <v-col v-for="(avatar, avatarIndex) in record.main_avatars" :key="avatarIndex" cols="3">
                                <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-1">
                                  <v-img :src="avatar.icon" :alt="`角色 ${avatar.id}`" class="rounded elevation-1 mx-auto"
                                    height="40" width="40" />
                                  <div class="text-caption mt-1 text-center">
                                    <div>等级: {{ avatar.level }}</div>
                                    <v-chip v-if="avatar.is_trail_avatar" size="x-small" color="success"
                                      variant="tonal">
                                      试用
                                    </v-chip>
                                  </div>
                                </v-card>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <!-- 支援角色 -->
                      <v-col cols="12" md="6">
                        <v-card variant="outlined" class="h-100">
                          <v-card-title class="text-subtitle-2">
                            支援角色
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>
                            <v-row dense>
                              <v-col v-for="(avatar, avatarIndex) in record.support_avatars" :key="avatarIndex"
                                cols="3">
                                <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-1">
                                  <v-img :src="avatar.icon" :alt="`角色 ${avatar.id}`" class="rounded elevation-1 mx-auto"
                                    height="40" width="40" />
                                  <div class="text-caption mt-1 text-center">
                                    <div>等级: {{ avatar.level }}</div>
                                    <v-chip v-if="avatar.is_trail_avatar" size="x-small" color="success"
                                      variant="tonal">
                                      试用
                                    </v-chip>
                                  </div>
                                </v-card>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>

                  <!-- 符文信息 -->
                  <div v-if="record.runes && record.runes.length > 0">
                    <div class="text-subtitle-2 font-weight-bold mb-2">符文配置</div>
                    <v-row>
                      <v-col v-for="(rune, runeIndex) in record.runes" :key="runeIndex" cols="12" md="6" lg="4">
                        <v-card variant="tonal" :color="getRuneColor(rune.element)" class="h-100">
                          <v-card-title class="text-subtitle-2 d-flex align-center">
                            <v-img v-if="rune.icon" :src="rune.icon" width="24" height="24" class="mr-2"
                              max-width="24"></v-img>
                            {{ rune.name }}
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>
                            <div class="text-caption">{{ removeColorTags(rune.desc) }}</div>
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
  name: 'Rogue',
  props: {
    activityData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // 获取通过状态对应的颜色
    const getPassedColor = (isPassed) => {
      return isPassed ? 'success' : 'error'
    }

    // 获取符文元素对应的颜色
    const getRuneColor = (element) => {
      const colorMap = {
        'Pyro': 'error',
        'Hydro': 'info',
        'Anemo': 'success',
        'Electro': 'purple',
        'Dendro': 'green',
        'Cryo': 'cyan',
        'Geo': 'amber'
      }
      return colorMap[element] || 'accent'
    }

    // 计算总挑战数
    const getTotalChallenges = () => {
      return props.activityData?.records?.length || 0
    }

    // 计算通过挑战数
    const getPassedChallenges = () => {
      return props.activityData?.records?.filter(record => record.is_passed).length || 0
    }

    // 计算总符文数
    const getTotalRunes = () => {
      return props.activityData?.records?.reduce((total, record) => total + (record.runes?.length || 0), 0) || 0
    }

    // 移除HTML颜色标签
    const removeColorTags = (text) => {
      if (!text) return ''
      return text.replace(/<color=#[0-9a-fA-F]+>/g, '').replace(/<\/color>/g, '').replace(/\\n/g, '')
    }

    return {
      getPassedColor,
      getRuneColor,
      getTotalChallenges,
      getPassedChallenges,
      getTotalRunes,
      removeColorTags
    }
  }
}
</script>

<style scoped>
.rogue-container {
  padding: 16px;
}

/* 响应式间距调整 */
@media (max-width: 960px) {
  .rogue-container {
    padding: 12px;
  }
}

@media (max-width: 600px) {
  .rogue-container {
    padding: 8px;
  }
}
</style>