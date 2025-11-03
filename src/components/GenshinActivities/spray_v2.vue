<template>
  <div class="spray-v2-container">
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
          <v-icon class="mr-2">mdi-flask-outline</v-icon>
          合剂演进
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
                <div class="text-h5 font-weight-bold text-secondary">{{ activityData.data?.length || 0 }}</div>
                <div class="text-caption text-medium-emphasis">挑战关卡数</div>
              </div>
            </v-col>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-success">{{ getTotalGalleries() || 0 }}</div>
                <div class="text-caption text-medium-emphasis">总阵容数</div>
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
            <v-col v-for="(challenge, index) in activityData.data" :key="index" cols="12">
              <v-card class="h-100" variant="outlined" hover>
                <!-- 挑战头部信息 -->
                <v-card-title class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ challenge.name }}</div>
                    <div class="d-flex align-center mt-1">
                      <v-chip size="small" :color="getDifficultyColor(challenge.difficult_id)" variant="tonal"
                        class="mr-2">
                        {{ getDifficultyText(challenge.difficult_id) }}
                      </v-chip>
                      <v-chip size="small" color="info" variant="tonal">
                        {{ challenge.factor }}x 倍率
                      </v-chip>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-h6 font-weight-bold text-error">{{ challenge.score || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">最高分数</div>
                    <div v-if="challenge.icon" class="mt-1">
                      <v-img :src="challenge.icon" width="32" height="32" class="mx-auto"></v-img>
                    </div>
                  </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 阵容列表 -->
                  <div class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">阵容配置</div>
                    <v-row>
                      <v-col v-for="(gallery, galleryIndex) in challenge.galleries" :key="galleryIndex" cols="12" md="6"
                        lg="4">
                        <v-card variant="outlined" class="h-100">
                          <v-card-title class=" d-flex align-center text-subtitle-2">
                            第 {{ galleryIndex + 1 }} 轮次
                            <v-spacer></v-spacer>
                            <span>
                              分数 {{ gallery.score }}
                            </span>
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>
                            <!-- 角色信息 -->
                            <div class="mb-3">
                              <div class="text-caption font-weight-bold mb-1">角色</div>
                              <v-row dense>
                                <v-col v-for="(avatar, avatarIndex) in gallery.avatars" :key="avatarIndex" cols="3">
                                  <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-1">
                                    <v-img :src="avatar.icon" :alt="`角色 ${avatar.id}`"
                                      class="rounded elevation-1 mx-auto" height="40" width="40" />
                                    <div class="text-caption mt-1 text-center">
                                      <div>Lv.{{ avatar.level }}</div>
                                      <v-chip v-if="avatar.is_trial" size="x-small" color="success" variant="tonal">
                                        试用
                                      </v-chip>
                                    </div>
                                  </v-card>
                                </v-col>
                              </v-row>
                            </div>

                            <!-- 增益效果 -->
                            <div>
                              <div class="text-caption font-weight-bold mb-1">增益效果</div>
                              <v-row dense>
                                <v-col v-for="(buff, buffIndex) in gallery.buffs" :key="buffIndex" cols="12">
                                  <v-card variant="tonal" color="accent" class="pa-1 mb-1">
                                    <div class="d-flex align-center">
                                      <v-img v-if="buff.icon" :src="buff.icon" width="24" height="24"
                                        class="mr-2 rounded-circle" max-width="24"
                                        style="background-color: #666;"></v-img>
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
  name: 'SprayV2',
  props: {
    activityData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // 获取难度文本
    const getDifficultyText = (difficulty) => {
      const difficultyMap = {
        0: '简单',
        1: '普通',
        2: '困难',
        3: '极限'
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
      if (!props.activityData?.data) return 0
      return props.activityData.data.reduce((total, challenge) => total + (challenge.score || 0), 0)
    }

    // 计算总阵容数
    const getTotalGalleries = () => {
      if (!props.activityData?.data) return 0
      return props.activityData.data.reduce((total, challenge) => total + (challenge.galleries?.length || 0), 0)
    }

    // 移除HTML颜色标签
    const removeColorTags = (text) => {
      if (!text) return ''
      return text.replace(/<color=#[0-9a-fA-F]+>/g, '').replace(/<\/color>/g, '')
    }

    return {
      getDifficultyText,
      getDifficultyColor,
      getTotalScore,
      getTotalGalleries,
      removeColorTags
    }
  }
}
</script>

<style scoped>
.spray-v2-container {
  padding: 16px;
}

/* 响应式间距调整 */
@media (max-width: 960px) {
  .spray-v2-container {
    padding: 12px;
  }
}

@media (max-width: 600px) {
  .spray-v2-container {
    padding: 8px;
  }
}
</style>