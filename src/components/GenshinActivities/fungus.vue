<template>
  <div class="fungus-container">
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
          <v-icon class="mr-2">mdi-mushroom</v-icon>
          智巧灵蕈大竞逐
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="6" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-accent">{{ activityData.monster_num || 0 }}</div>
                <div class="text-caption text-medium-emphasis">已捕捉蕈兽</div>
              </div>
            </v-col>
            <v-col cols="6" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-secondary">{{ activityData.battle_count || 0 }}</div>
                <div class="text-caption text-medium-emphasis">战斗次数</div>
              </div>
            </v-col>
            <v-col cols="6" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-success">{{ getEvokedMonstersCount() || 0 }}</div>
                <div class="text-caption text-medium-emphasis">已焕发潜能</div>
              </div>
            </v-col>
            <v-col cols="6" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-warning">{{ getTotalBattleCount() || 0 }}</div>
                <div class="text-caption text-medium-emphasis">总战斗次数</div>
              </div>
            </v-col>
          </v-row>

          <!-- 统计信息 -->
          <v-row class="mt-3">
            <v-col cols="12" md="4">
              <v-card variant="tonal" color="error" class="text-center pa-3">
                <div class="text-h6 font-weight-bold">{{ activityData.attack?.records?.length || 0 }}</div>
                <div class="text-caption">攻击记录</div>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card variant="tonal" color="success" class="text-center pa-3">
                <div class="text-h6 font-weight-bold">{{ activityData.defence?.records?.length || 0 }}</div>
                <div class="text-caption">防御记录</div>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card variant="tonal" color="warning" class="text-center pa-3">
                <div class="text-h6 font-weight-bold">{{ activityData.match?.records?.length || 0 }}</div>
                <div class="text-caption">对战记录</div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      <v-card variant="outlined" class="h-100 mb-2">
        <v-card-text> <!-- 蕈兽伙伴信息 -->
          <v-row>
            <v-col cols="12" md="6">
              <div class="d-flex align-center">
                <v-avatar size="48" class="mr-3">
                  <v-img :src="activityData.avatar" alt="训兽师"></v-img>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ activityData.nickname }}</div>
                  <div class="text-caption text-medium-emphasis">训兽师</div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="d-flex align-center">
                <v-avatar size="48" class="mr-3">
                  <v-img :src="activityData.ace_monster_icon" :alt="activityData.ace_monster"></v-img>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ activityData.ace_monster }}</div>
                  <div class="text-caption text-medium-emphasis">王牌蕈兽</div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 蕈兽手册区域 -->
      <v-card class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-book-open-variant</v-icon>
          蕈兽图鉴
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="monster in activityData.handbook?.monsters" :key="monster.id" cols="12" md="6">
              <v-card class="h-100" variant="outlined" hover>
                <!-- 蕈兽头部信息 -->
                <v-card-title class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center">
                    <v-avatar size="40" class="mr-3">
                      <v-img :src="monster.icon" :alt="monster.name"></v-img>
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">{{ monster.name }}</div>
                      <div class="mt-1 d-flex flex-wrap">
                          <v-chip size="small" :color="getCategoryColor(monster.category)" variant="tonal" class="mr-2 mb-1">
                            {{ getCategoryText(monster.category) }}
                          </v-chip>
                          <v-chip size="small" color="orange" variant="tonal" class="mr-2 mb-1">
                            调配步数 {{ monster.step }}
                          </v-chip>
                        <v-chip size="small" :color="getStatusColor(monster.status)" variant="tonal" class="mb-1">
                          {{ getStatusText(monster.status) }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-h6 font-weight-bold text-success">{{ monster.battle_count || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">战斗次数</div>
                  </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 蕈兽描述 -->
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">{{ removeColorTags(monster.desc) }}</div>
                  </div>

                  <!-- 捕获时间 -->
                  <div class="mb-3">
                    <div class="text-caption font-weight-bold mb-1">捕获时间</div>
                    <div class="text-caption">{{ formatCatchTime(monster.catch_time) }}</div>
                  </div>

                  <!-- 技能信息 -->
                  <div>
                    <div class="text-caption font-weight-bold mb-2">蕈兽战技</div>
                    <v-row dense>
                      <v-col cols="12">
                        <v-card variant="tonal" color="accent" class="pa-2 mb-2">
                          <div class="d-flex align-center">
                            <v-icon class="mr-2" color="success"
                              v-if="monster.skill_1?.is_unlock">mdi-check-circle</v-icon>
                            <v-icon class="mr-2" color="grey" v-else>mdi-circle-outline</v-icon>
                            <div>
                              <div class="text-caption font-weight-bold">{{ removeColorTags(monster.skill_1?.name) }}
                              </div>
                              <div class="text-caption text-medium-emphasis">{{ removeColorTags(monster.skill_1?.desc)
                                }}</div>
                            </div>
                          </div>
                        </v-card>
                      </v-col>
                      <v-col cols="12">
                        <v-card variant="tonal" color="accent" class="pa-2 mb-2">
                          <div class="d-flex align-center">
                            <v-icon class="mr-2" color="success"
                              v-if="monster.skill_2?.is_unlock">mdi-check-circle</v-icon>
                            <v-icon class="mr-2" color="grey" v-else>mdi-circle-outline</v-icon>
                            <div>
                              <div class="text-caption font-weight-bold">{{ removeColorTags(monster.skill_2?.name) }}
                              </div>
                              <div class="text-caption text-medium-emphasis">{{ removeColorTags(monster.skill_2?.desc)
                                }}</div>
                            </div>
                          </div>
                        </v-card>
                      </v-col>
                      <v-col cols="12">
                        <v-card variant="tonal" color="accent" class="pa-2">
                          <div class="d-flex align-center">
                            <v-icon class="mr-2" color="success"
                              v-if="monster.skill_3?.is_unlock">mdi-check-circle</v-icon>
                            <v-icon class="mr-2" color="grey" v-else>mdi-circle-outline</v-icon>
                            <div>
                              <div class="text-caption font-weight-bold">{{ removeColorTags(monster.skill_3?.name) }}
                              </div>
                              <div class="text-caption text-medium-emphasis">{{ removeColorTags(monster.skill_3?.desc)
                                }}</div>
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
        </v-card-text>
      </v-card>

      <!-- 攻击记录区域 -->
      <v-card v-if="activityData.attack?.records?.length" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-sword-cross</v-icon>
          强化特训 · 协同攻势
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="(record, index) in activityData.attack.records" :key="index" cols="12">
              <v-card class="h-100" variant="outlined" hover>
                <!-- 记录头部信息 -->
                <v-card-title class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ record.name }}</div>
                    <div class="text-caption text-medium-emphasis mt-1">
                      {{ formatChallengeTime(record.challenge_time) }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-h6 font-weight-bold text-error">{{ record.score || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">得分</div>
                  </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 阵容配置 -->
                  <div>
                    <div class="text-subtitle-2 font-weight-bold mb-2">阵容配置</div>
                    <v-row>
                      <v-col v-for="(lineup, lineupIndex) in record.lineup" :key="lineupIndex" cols="12">
                        <v-card variant="outlined" class="h-100">
                          <v-card-title class="text-subtitle-2">
                            阵容 {{ lineupIndex + 1 }}
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>
                            <!-- 蕈兽信息 -->
                            <div>
                              <div class="text-caption font-weight-bold mb-1">蕈兽</div>
                              <v-row dense>
                                <v-col v-for="(monster, monsterIndex) in lineup.monsters" :key="monsterIndex" cols="2">
                                  <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-1">
                                    <v-img :src="monster.icon" :alt="`蕈兽 ${monster.id}`"
                                      class="rounded elevation-1 mx-auto" height="40" width="40" />
                                    <div class="text-caption mt-1 text-center">
                                      <div class="font-weight-bold">{{ getMonsterNameById(monster.id) }}</div>
                                      <v-chip v-if="monster.is_backup" size="x-small" color="warning" variant="tonal">
                                        替补
                                      </v-chip>
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

      <!-- 防御记录区域 -->
      <v-card v-if="activityData.defence?.records?.length" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-shield</v-icon>
          强化特训 · 要地防御
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="(record, index) in activityData.defence.records" :key="index" cols="12">
              <v-card class="h-100" variant="outlined" hover>
                <!-- 记录头部信息 -->
                <v-card-title class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ record.name }}</div>
                    <div class="text-caption text-medium-emphasis mt-1">
                      {{ formatChallengeTime(record.challenge_time) }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-h6 font-weight-bold text-success">{{ record.score || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">得分</div>
                  </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 阵容配置 -->
                  <div>
                    <div class="text-subtitle-2 font-weight-bold mb-2">阵容配置</div>
                    <v-row>
                      <v-col v-for="(lineup, lineupIndex) in record.lineup" :key="lineupIndex" cols="12">
                        <v-card variant="outlined" class="h-100">
                          <v-card-title class="text-subtitle-2">
                            阵容 {{ lineupIndex + 1 }}
                          </v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>
                            <!-- 蕈兽信息 -->
                            <div>
                              <div class="text-caption font-weight-bold mb-1">蕈兽</div>
                              <v-row dense>
                                <v-col v-for="(monster, monsterIndex) in lineup.monsters" :key="monsterIndex" cols="2">
                                  <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-1">
                                    <v-img :src="monster.icon" :alt="`蕈兽 ${monster.id}`"
                                      class="rounded elevation-1 mx-auto" height="40" width="40" />
                                    <div class="text-caption mt-1 text-center">
                                      <div class="font-weight-bold">{{ getMonsterNameById(monster.id) }}</div>
                                      <v-chip v-if="monster.is_backup" size="x-small" color="warning" variant="tonal">
                                        替补
                                      </v-chip>
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

      <!-- 对战记录区域 -->
      <v-card v-if="activityData.match?.records?.length" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-trophy</v-icon>
          驯兽师大赛
          <v-chip v-if="activityData.match?.best_rank" color="warning" variant="tonal" class="ml-2">
            最佳排名: 第{{ activityData.match.best_rank }}名
          </v-chip>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="(record, index) in activityData.match.records" :key="index" cols="12" md="6" lg="4">
              <v-card class="h-100" variant="outlined" hover>
                <!-- 记录头部信息 -->
                <v-card-title class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">第{{ record.round }}轮</div>
                    <div class="text-caption text-medium-emphasis mt-1">
                      {{ formatChallengeTime(record.challenge_time) }}
                    </div>
                  </div>
                  <v-chip v-if="record.finished" color="success" variant="tonal" size="small">
                    已完成
                  </v-chip>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 对手信息 -->
                  <div class="mb-3">
                    <div class="text-caption font-weight-bold mb-1">对手信息</div>
                    <div class="d-flex align-center">
                      <v-avatar size="40" class="mr-3">
                        <v-img :src="record.avatar" :alt="record.nickname"></v-img>
                      </v-avatar>
                      <div>
                        <div class="text-subtitle-2 font-weight-bold">{{ record.nickname }}</div>
                        <div class="text-caption text-medium-emphasis">
                          王牌: {{ record.ace_monster }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 蕈兽对比 -->
                  <div>
                    <div class="text-caption font-weight-bold mb-1">蕈兽对比</div>
                    <v-row dense>
                      <v-col cols="6">
                        <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-2">
                          <v-img :src="record.my_monster_icon" alt="我方蕈兽" class="rounded elevation-1 mx-auto"
                            height="40" width="40" />
                          <div class="text-caption mt-1 text-center">
                            <div class="font-weight-bold">我方蕈兽</div>
                          </div>
                        </v-card>
                      </v-col>
                      <v-col cols="6">
                        <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-2">
                          <v-img :src="record.ace_monster_icon" :alt="record.ace_monster"
                            class="rounded elevation-1 mx-auto" height="40" width="40" />
                          <div class="text-caption mt-1 text-center">
                            <div class="font-weight-bold">{{ record.ace_monster }}</div>
                            <div class="text-medium-emphasis">对手王牌</div>
                          </div>
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
  name: 'Fungus',
  props: {
    activityData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // 获取已焕发潜能的蕈兽数量
    const getEvokedMonstersCount = () => {
      if (!props.activityData?.handbook?.monsters) return 0
      return props.activityData.handbook.monsters.filter(monster => monster.status === 'evoked').length
    }

    // 获取总战斗次数
    const getTotalBattleCount = () => {
      if (!props.activityData?.handbook?.monsters) return 0
      return props.activityData.handbook.monsters.reduce((total, monster) => total + (monster.battle_count || 0), 0)
    }

    // 获取类别文本
    const getCategoryText = (category) => {
      const categoryMap = {
        'healing_support': '治疗援护',
        'high_impact': '高效打击',
        'combat_buff': '战斗增益',
        'formation_fulcrum': '阵线支点'
      }
      return categoryMap[category] || category
    }

    // 获取类别对应的颜色
    const getCategoryColor = (category) => {
      const colorMap = {
        'healing_support': 'success',
        'high_impact': 'error',
        'combat_buff': 'warning',
        'formation_fulcrum': 'info'
      }
      return colorMap[category] || 'grey'
    }

    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        'evoked': '已焕发潜能',
        'normal': '普通状态'
      }
      return statusMap[status] || status
    }

    // 获取状态对应的颜色
    const getStatusColor = (status) => {
      const colorMap = {
        'evoked': 'success',
        'normal': 'grey'
      }
      return colorMap[status] || 'grey'
    }

    // 根据蕈兽ID获取名称
    const getMonsterNameById = (id) => {
      if (!props.activityData?.handbook?.monsters) return `蕈兽 ${id}`
      const monster = props.activityData.handbook.monsters.find(m => m.id === id)
      return monster ? monster.name : `蕈兽 ${id}`
    }

    // 格式化捕获时间
    const formatCatchTime = (catchTime) => {
      if (!catchTime) return '未知'
      const { year, month, day, hour, minute } = catchTime
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }

    // 格式化挑战时间
    const formatChallengeTime = (challengeTime) => {
      if (!challengeTime) return '未知'
      const { year, month, day, hour, minute } = challengeTime
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }

    // 移除HTML颜色标签
    const removeColorTags = (text) => {
      if (!text) return ''
      return text.replace(/<color=#[0-9a-fA-F]+>/g, '').replace(/<\/color>/g, '')
    }

    return {
      getEvokedMonstersCount,
      getTotalBattleCount,
      getCategoryText,
      getCategoryColor,
      getStatusText,
      getStatusColor,
      getMonsterNameById,
      formatCatchTime,
      formatChallengeTime,
      removeColorTags
    }
  }
}
</script>

<style scoped>
.fungus-container {
  padding: 16px;
}

/* 蕈兽卡片样式优化 */
.fungus-container .v-card {
  transition: all 0.3s ease;
}

.fungus-container .v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 技能卡片样式 */
.skill-card {
  border-left: 3px solid #4CAF50;
}

/* 蕈兽头像容器 */
.monster-avatar-container {
  position: relative;
}

.monster-avatar-container .backup-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 1;
}

/* 响应式间距调整 */
@media (max-width: 960px) {
  .fungus-container {
    padding: 12px;
  }

  .fungus-container .v-col {
    margin-bottom: 16px;
  }

  .fungus-container .v-card-title {
    padding: 12px 16px;
  }

  .fungus-container .v-card-text {
    padding: 12px 16px;
  }
}

@media (max-width: 600px) {
  .fungus-container {
    padding: 8px;
  }

  .fungus-container .v-col {
    margin-bottom: 12px;
  }

  .fungus-container .v-card-title {
    padding: 8px 12px;
    font-size: 1rem;
  }

  .fungus-container .v-card-text {
    padding: 8px 12px;
  }

  /* 移动端芯片组布局优化 */
  .fungus-container .v-chip-group {
    flex-wrap: wrap;
    gap: 4px;
  }

  .fungus-container .v-chip {
    margin-bottom: 4px;
  }

  /* 移动端技能卡片布局 */
  .fungus-container .skill-card .v-card-text {
    padding: 8px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1280px) {
  .fungus-container .v-col-lg-4 {
    flex: 0 0 33.333333%;
    max-width: 33.333333%;
  }

  .fungus-container .v-col-lg-6 {
    flex: 0 0 50%;
    max-width: 50%;
  }
}

/* 加载动画 */
@keyframes pulse {
  0% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.6;
  }
}

.fungus-container .v-card--loading {
  animation: pulse 2s infinite;
}
</style>