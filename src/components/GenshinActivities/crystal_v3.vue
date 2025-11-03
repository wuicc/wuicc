<template>
  <div class="crystal-v3-activity">
    <div v-if="loading" class="loading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <span>加载中...</span>
    </div>

    <div v-else-if="error" class="error">
      <v-alert type="error">
        {{ error }}
      </v-alert>
    </div>

    <div v-else>
      <!-- 活动基本信息卡片 -->
      <v-card class="activity-info-card mb-4">
        <v-card-title class="headline">
          <v-icon left>mdi-crystal-ball</v-icon>
          振晶的应用研究
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6" md="3">
              <div class="stat-item">
                <div class="stat-label">总试炼数</div>
                <div class="stat-value">{{ getTotalTrials() }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="stat-item">
                <div class="stat-label">已完成试炼</div>
                <div class="stat-value">{{ getCompletedTrials() }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="stat-item">
                <div class="stat-label">完成率</div>
                <div class="stat-value">{{ getCompletionRate() }}%</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="stat-item">
                <div class="stat-label">最高分数</div>
                <div class="stat-value">{{ getMaxScore() }}</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 活动状态提示 -->
      <v-alert v-if="!activityData.exists_data" type="info" class="mb-4">
        该活动暂无数据记录
      </v-alert>

      <!-- 试炼记录 -->
      <v-row>
        <v-col v-for="(record, index) in activityData.records" :key="index" cols="12" sm="6" md="4">
          <v-card class="trial-card" :class="{ 'completed': record.finished, 'not-completed': !record.finished }">
            <v-card-title class="d-flex align-center">
              <v-icon :color="record.finished ? 'success' : 'grey'" class="mr-2">
                {{ record.finished ? 'mdi-check-circle' : 'mdi-circle-outline' }}
              </v-icon>
              <span class="trial-name">{{ record.stage_name }}</span>
            </v-card-title>
            
            <v-card-text>
              <div class="trial-info">
                <div class="info-item">
                  <v-icon small class="mr-1">mdi-trophy</v-icon>
                  <span>分数: {{ record.stage_score }}</span>
                </div>
                <div class="info-item">
                  <v-icon small class="mr-1">mdi-medal</v-icon>
                  <span>勋章: {{ getMedalText(record.medal) }}</span>
                </div>
                <div class="info-item">
                  <v-icon small class="mr-1">mdi-gauge</v-icon>
                  <span>难度: {{ record.difficulty_id }}</span>
                </div>
                <div class="info-item">
                  <v-icon small class="mr-1">mdi-multiply</v-icon>
                  <span>倍率: {{ record.factor }}</span>
                </div>
              </div>
              
              <!-- 上下半场信息 -->
              <div v-if="record.finished" class="half-sections">
                <div v-if="record.first_half" class="half-section">
                  <h6 class="section-title">上半场</h6>
                  <div class="avatar-grid">
                    <div v-for="avatar in record.first_half.avatars" :key="avatar.id" class="avatar-item">
                      <v-img :src="avatar.icon" width="40" height="40" class="avatar-icon"></v-img>
                      <div class="avatar-info">
                        <div class="avatar-level">Lv.{{ avatar.level }}</div>
                        <v-chip x-small :color="getRarityColor(avatar.rarity)">
                          {{ avatar.rarity }}★
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="record.second_half" class="half-section mt-2">
                  <h6 class="section-title">下半场</h6>
                  <div class="avatar-grid">
                    <div v-for="avatar in record.second_half.avatars" :key="avatar.id" class="avatar-item">
                      <v-img :src="avatar.icon" width="40" height="40" class="avatar-icon"></v-img>
                      <div class="avatar-info">
                        <div class="avatar-level">Lv.{{ avatar.level }}</div>
                        <v-chip x-small :color="getRarityColor(avatar.rarity)">
                          {{ avatar.rarity }}★
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="not-completed-text">
                <v-icon small class="mr-1">mdi-lock</v-icon>
                试炼未完成
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CrystalV3Activity',
  props: {
    activityData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      error: null
    }
  },
  methods: {
    // 获取总试炼数
    getTotalTrials() {
      return this.activityData.records ? this.activityData.records.length : 0;
    },

    // 获取已完成试炼数
    getCompletedTrials() {
      if (!this.activityData.records) return 0;
      return this.activityData.records.filter(record => record.finished).length;
    },

    // 获取完成率
    getCompletionRate() {
      const total = this.getTotalTrials();
      const completed = this.getCompletedTrials();
      if (total === 0) return 0;
      return Math.round((completed / total) * 100);
    },

    // 获取最高分数
    getMaxScore() {
      if (!this.activityData.records || this.activityData.records.length === 0) return 0;
      const scores = this.activityData.records.map(record => record.stage_score);
      return Math.max(...scores);
    },

    // 获取勋章文本
    getMedalText(medal) {
      const medalTexts = {
        0: '无',
        1: '铜牌',
        2: '银牌',
        3: '金牌'
      };
      return medalTexts[medal] || '未知';
    },

    // 获取稀有度颜色
    getRarityColor(rarity) {
      const colors = {
        4: 'purple',
        5: 'orange'
      };
      return colors[rarity] || 'grey';
    }
  }
}
</script>

<style scoped>
.crystal-v3-activity {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
}

.error {
  padding: 20px;
}

.activity-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.trial-card {
  height: 100%;
  transition: all 0.3s ease;
}

.trial-card.completed {
  border-left: 4px solid #4caf50;
}

.trial-card.not-completed {
  border-left: 4px solid #9e9e9e;
  opacity: 0.7;
}

.trial-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.trial-name {
  font-size: 16px;
  font-weight: bold;
}

.trial-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.half-sections {
  margin-top: 12px;
}

.section-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: bold;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.avatar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  background: #f5f5f5;
  border-radius: 4px;
}

.avatar-icon {
  border-radius: 4px;
}

.avatar-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.avatar-level {
  font-size: 10px;
  color: #666;
}

.not-completed-text {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9e9e9e;
  font-style: italic;
  padding: 20px 0;
}

@media (max-width: 768px) {
  .crystal-v3-activity {
    padding: 10px;
  }
  
  .avatar-grid {
    grid-template-columns: 1fr;
  }
}
</style>