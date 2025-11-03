<template>
  <div class="martial-legend-v3-activity">
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
          <v-icon left>mdi-sword</v-icon>
          殊形之龙参寻战记
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6" md="3">
              <div class="stat-item">
                <div class="stat-label">总挑战数</div>
                <div class="stat-value">{{ getTotalChallenges() }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="stat-item">
                <div class="stat-label">已完成挑战</div>
                <div class="stat-value">{{ getCompletedChallenges() }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="stat-item">
                <div class="stat-label">金牌数量</div>
                <div class="stat-value">{{ getGoldMedals() }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="stat-item">
                <div class="stat-label">最快用时</div>
                <div class="stat-value">{{ getBestTime() }}</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 挑战记录 -->
      <v-card v-for="(record, index) in activityData.records" :key="index" class="challenge-record mb-4">
        <v-card-title class="d-flex align-center">
          <span class="challenge-name">{{ record.challenge_name }}</span><v-spacer></v-spacer>
          <v-chip v-if="record.difficulty > 0" small class="ml-2" :color="getDifficultyColor(record.difficulty)">
            {{ getDifficultyText(record.difficulty) }}
          </v-chip>
          <v-chip v-if="record.medal > 0" small class="ml-2" :color="getMedalColor(record.medal)">
            {{ getMedalText(record.medal) }}
          </v-chip>
          <v-chip v-if="record.best_used_time > 0" small class="ml-2" color="success">
            用时 {{ formatTime(record.best_used_time) }}
          </v-chip>
          <v-chip v-if="record.star > 0" small class="ml-2" color="accent">
            {{ record.star }}★
          </v-chip>
        </v-card-title>

        <v-card-text>
          <!-- 挑战信息 -->
          <div v-if="record.finished" class="challenge-info">
            <!-- Boss信息 -->
            <div class="boss-section">
              <h4 class="section-title">Boss信息</h4>
              <div class="boss-info">
                <v-img v-if="record.challenges.boss_icon" :src="record.challenges.boss_icon" width="80" height="80"
                  class="boss-icon"></v-img>
                <div class="boss-details">
                  <div class="boss-name">{{ record.challenges.boss_name }}</div>
                  <div class="boss-stats">
                    <span>难度: {{ getDifficultyText(record.difficulty) }}</span>
                    <span>用时: {{ formatTime(record.best_used_time) }}</span>
                    <span>勋章: {{ getMedalText(record.medal) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 角色阵容 -->
            <div v-if="record.challenges.avatars.length > 0" class="avatars-section">
              <h4 class="section-title">角色阵容</h4>
              <div class="avatar-grid">
                <div v-for="avatar in record.challenges.avatars" :key="avatar.id" class="avatar-item">
                  <v-img :src="avatar.icon" width="60" height="60" class="avatar-icon"></v-img>
                  <div class="avatar-info">
                    <div class="avatar-level">Lv.{{ avatar.level }}</div>
                    <v-chip x-small :color="getRarityColor(avatar.rarity)">
                      {{ avatar.rarity }}★
                    </v-chip>
                  </div>
                </div>
              </div>
            </div>
            <!-- 支援策略 -->
            <div v-if="record.supports.length > 0" class="supports-section">
              <h4 class="section-title">交涉策略</h4>
              <div class="supports-grid">
                <div v-for="support in record.supports" :key="support.id" class="support-item">
                  <div class="support-header">
                    <v-icon small class="mr-1">mdi-lightbulb-on</v-icon>
                    <span class="support-name">{{ support.name }}</span>
                  </div>
                  <div class="support-desc" v-html="formatSupportDesc(support.desc)"></div>
                </div>
              </div>
            </div>

          </div>

          <!-- 未完成挑战 -->
          <div v-else class="not-completed">
            <v-icon>mdi-lock</v-icon>
            <span>挑战未完成</span>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MartialLegendV3Activity',
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
    // 获取总挑战数
    getTotalChallenges() {
      return this.activityData.records ? this.activityData.records.length : 0;
    },

    // 获取已完成挑战数
    getCompletedChallenges() {
      if (!this.activityData.records) return 0;
      return this.activityData.records.filter(record => record.finished).length;
    },

    // 获取金牌数量
    getGoldMedals() {
      if (!this.activityData.records) return 0;
      return this.activityData.records.filter(record => record.medal === 3).length;
    },

    // 获取最佳用时
    getBestTime() {
      if (!this.activityData.records || this.activityData.records.length === 0) return '--';
      const times = this.activityData.records
        .filter(record => record.best_used_time > 0)
        .map(record => record.best_used_time);
      if (times.length === 0) return '--';
      return this.formatTime(Math.min(...times));
    },

    // 格式化时间（秒转分:秒）
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    // 获取难度颜色
    getDifficultyColor(difficulty) {
      const colors = {
        1: 'green',
        2: 'blue',
        3: 'orange',
        4: 'red'
      };
      return colors[difficulty] || 'grey';
    },

    // 获取难度文本
    getDifficultyText(difficulty) {
      const difficultyMap = {
        1: '简单',
        2: '普通',
        3: '无畏',
        4: '极限'
      }
      return difficultyMap[difficulty] || `难度${difficulty}`
    },

    // 获取勋章颜色
    getMedalColor(medal) {
      const colors = {
        1: 'brown',
        2: 'grey',
        3: 'orange'
      };
      return colors[medal] || 'grey';
    },

    // 获取勋章文本
    getMedalText(medal) {
      const medalTexts = {
        1: '铜牌',
        2: '银牌',
        3: '金牌'
      };
      return medalTexts[medal] || '无';
    },

    // 获取稀有度颜色
    getRarityColor(rarity) {
      const colors = {
        4: 'purple',
        5: 'orange'
      };
      return colors[rarity] || 'grey';
    },

    // 格式化支援策略描述
    formatSupportDesc(desc) {
      return desc.replace(/\\n/g, '<br>')
        .replace(/<color=#d47202>(.*?)<\/color>/g, '<span class="highlight">$1</span>');
    }
  }
}
</script>

<style scoped>
.martial-legend-v3-activity {
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

.challenge-record {
  border-left: 4px solid #2196f3;
}

.challenge-name {
  font-size: 18px;
  font-weight: bold;
}

/* .challenge-info {
  padding: 16px 0;
} */

.section-title {
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 8px;
}

.boss-section {
  margin-bottom: 20px;
}

.boss-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.boss-icon {
  border-radius: 8px;
}

.boss-details {
  flex: 1;
}

.boss-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.boss-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.supports-section {
  margin-bottom: 20px;
}

.supports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.support-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.support-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.support-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.support-desc {
  font-size: 13px;
  line-height: 1.5;
  color: #555;
}

.highlight {
  color: #d47202;
  font-weight: bold;
}

.avatars-section {
  margin-bottom: 20px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.avatar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-icon {
  border-radius: 8px;
}

.avatar-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.avatar-level {
  font-size: 12px;
  color: #666;
}

.not-completed {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #9e9e9e;
  font-style: italic;
}

@media (max-width: 768px) {
  .martial-legend-v3-activity {
    padding: 10px;
  }

  .boss-info {
    flex-direction: column;
    text-align: center;
  }

  .boss-stats {
    flex-direction: column;
    gap: 8px;
  }

  .supports-grid {
    grid-template-columns: 1fr;
  }

  .avatar-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>