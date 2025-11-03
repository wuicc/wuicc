<template>
  <div class="penumbra-adventure-container">
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
          <v-icon class="mr-2">mdi-map-marker</v-icon>
          清夏！乐园？大秘境！
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-accent">{{ activityData.way_point_number || 0 }}/{{ activityData.max_way_point_number || 0 }}</div>
                <div class="text-caption text-medium-emphasis">传送点</div>
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-secondary">{{ activityData.chest_number || 0 }}</div>
                <div class="text-caption text-medium-emphasis">宝箱数量</div>
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-success">{{ activityData.anchor_number || 0 }}/{{ activityData.max_anchor_number || 0 }}</div>
                <div class="text-caption text-medium-emphasis">锚点数量</div>
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-warning">{{ getTotalChallenges() || 0 }}</div>
                <div class="text-caption text-medium-emphasis">挑战总数</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 靶向射击区域 -->
      <v-card v-if="activityData.target_shooting?.length" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-target</v-icon>
          靶向射击
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="shooting in activityData.target_shooting" :key="shooting.name" cols="12" md="6" lg="3">
              <v-card variant="outlined" class="h-100">
                <v-card-title class="text-subtitle-2 d-flex align-center">
                  <v-img v-if="shooting.heraldry_icon" :src="shooting.heraldry_icon" width="48" height="48" class="mr-2" max-width="48px"></v-img>
                  {{ shooting.name }}
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-accent">{{ shooting.best_score || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">最高分数</div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-secondary">{{ shooting.max_combo || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">最大连击</div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-success">{{ shooting.hit_target_num || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">命中目标数</div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <div class="d-flex justify-space-between align-center mt-2">
                    <v-chip v-if="shooting.is_mp" size="small" color="info" variant="tonal">
                      多人模式
                    </v-chip>
                    <v-chip v-else size="small" color="secondary" variant="tonal">
                      单人模式
                    </v-chip>
                    <v-chip v-if="shooting.finished" size="small" color="success" variant="tonal">
                      已完成
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 飞行装置区域 -->
      <v-card v-if="activityData.flight_gear?.length" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-airplane</v-icon>
          飞行装置
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="gear in activityData.flight_gear" :key="gear.name" cols="12" md="6" lg="3">
              <v-card variant="outlined" class="h-100">
                <v-card-title class="text-subtitle-2 d-flex align-center">
                  <v-img v-if="gear.heraldry_icon" :src="gear.heraldry_icon" width="48" height="48" class="mr-2" max-width="48px"></v-img>
                  {{ gear.name }}
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-accent">{{ gear.best_score || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">最高分数</div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-secondary">{{ formatCostTime(gear.time_cost) }}</div>
                    <div class="text-caption text-medium-emphasis">耗时</div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <div class="text-center">
                    <v-chip v-if="gear.finished" size="small" color="success" variant="tonal">
                      已完成
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 刃舞挑战区域 -->
      <v-card v-if="activityData.blade_dance?.length" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-sword</v-icon>
          刃舞挑战
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="dance in activityData.blade_dance" :key="dance.name" cols="12" md="6" lg="4">
              <v-card variant="outlined" class="h-100">
                <v-card-title class="text-subtitle-2">
                  {{ dance.name }}
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-accent">{{ formatCostTime(dance.time_cost) }}</div>
                    <div class="text-caption text-medium-emphasis">通关时间</div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  
                  <!-- 角色头像列表 -->
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis mb-2">使用角色:</div>
                    <div class="d-flex justify-center">
                      <v-avatar v-for="avatar in dance.avatar_list" :key="avatar.id" size="32" class="mx-1">
                        <v-img :src="avatar.icon" :alt="avatar.id"></v-img>
                      </v-avatar>
                    </div>
                  </div>
                  
                  <!-- 介绍信息 -->
                  <div v-if="dance.introduce?.length" class="mb-3">
                    <div class="text-caption text-medium-emphasis mb-1">挑战效果:</div>
                    <div v-for="(intro, index) in dance.introduce" :key="index" class="text-caption text-grey">
                      • {{ intro }}
                    </div>
                  </div>
                  
                  <v-divider class="my-2"></v-divider>
                  <div class="d-flex justify-space-between align-center mt-2">
                    <div class="text-caption text-medium-emphasis">
                      {{ formatUnixTime(dance.pass_time) }}
                    </div>
                    <v-chip v-if="dance.finished" size="small" color="success" variant="tonal">
                      已完成
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 滑板挑战区域 -->
      <v-card v-if="activityData.shuffle_board?.length">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-skateboard</v-icon>
          滑板挑战
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="board in activityData.shuffle_board" :key="board.name" cols="12" md="6" lg="4">
              <v-card variant="outlined" class="h-100">
                <v-card-title class="text-subtitle-2 d-flex align-center">
                  <v-img v-if="board.heraldry_icon" :src="board.heraldry_icon" width="48" height="48" class="mr-2" max-width="48px"></v-img>
                  {{ board.name }}
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-accent">{{ board.best_score || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">最高分数</div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <div class="text-center">
                    <v-chip v-if="board.finished" size="small" color="success" variant="tonal">
                      已完成
                    </v-chip>
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
  name: 'PenumbraAdventure',
  props: {
    activityData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // 格式化耗时显示为分秒格式
    const formatCostTime = (seconds) => {
      if (!seconds || seconds === 0) return '0秒'
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      
      if (minutes === 0) {
        return `${remainingSeconds}秒`
      } else {
        return `${minutes}分${remainingSeconds}秒`
      }
    }

    // 格式化Unix时间戳
    const formatUnixTime = (timestamp) => {
      if (!timestamp) return '未知'
      
      const date = new Date(timestamp * 1000)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hour}:${minute}`
    }

    // 计算总挑战数
    const getTotalChallenges = () => {
      if (!props.activityData) return 0
      
      let total = 0
      if (props.activityData.target_shooting?.length) {
        total += props.activityData.target_shooting.length
      }
      if (props.activityData.flight_gear?.length) {
        total += props.activityData.flight_gear.length
      }
      if (props.activityData.blade_dance?.length) {
        total += props.activityData.blade_dance.length
      }
      if (props.activityData.shuffle_board?.length) {
        total += props.activityData.shuffle_board.length
      }
      
      return total
    }

    return {
      formatCostTime,
      formatUnixTime,
      getTotalChallenges
    }
  }
}
</script>

<style scoped>
.penumbra-adventure-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.h-100 {
  height: 100%;
}

.text-caption {
  font-size: 0.75rem;
}

.v-card {
  border-radius: 8px;
}

.v-card-title {
  font-weight: 600;
}

.v-chip {
  font-size: 0.7rem;
}
</style>