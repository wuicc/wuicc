<template>
  <div class="toy-battle-activity">
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
          <v-icon left>mdi-robot</v-icon>
          机枢巧物前哨战
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

      <!-- QTE节奏游戏模式 -->
      <v-card v-if="activityData.toy_battle_qte && activityData.toy_battle_qte.length > 0" class="game-mode-card mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon left>mdi-music-note</v-icon>
          跃动节拍响应法
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6" md="3">
              <div class="mode-stat">
                <div class="mode-stat-label">完成关卡</div>
                <div class="mode-stat-value">{{ getCompletedQTE() }}/{{ activityData.toy_battle_qte.length }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="mode-stat">
                <div class="mode-stat-label">最高分数</div>
                <div class="mode-stat-value">{{ getMaxQTEScore() }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="mode-stat">
                <div class="mode-stat-label">平均准确率</div>
                <div class="mode-stat-value">{{ getAverageQTEAccuracy() }}%</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="mode-stat">
                <div class="mode-stat-label">正确次数</div>
                <div class="mode-stat-value">{{ getTotalQTERight() }}</div>
              </div>
            </v-col>
          </v-row>

          <!-- QTE关卡列表 -->
          <div class="challenge-list">
            <div v-for="challenge in activityData.toy_battle_qte" :key="challenge.name" class="challenge-item">
              <div class="challenge-header">
                <span class="challenge-name">{{ challenge.name }}</span>
                <v-chip v-if="challenge.finished" small class="ml-2" color="success">已完成</v-chip>
              </div>
              <div class="challenge-stats">
                <span>最高分数: {{ challenge.best_score }}</span>
                <span>正确次数: {{ challenge.right_num }}</span>
                <span>准确率: {{ (challenge.accuracy_percent / 100).toFixed(2) }}%</span>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- 竞速模式 -->
      <v-card v-if="activityData.toy_battle_current && activityData.toy_battle_current.length > 0"
        class="game-mode-card mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon left>mdi-timer</v-icon>
          湍流疾行冲锋赛
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6" md="3">
              <div class="mode-stat">
                <div class="mode-stat-label">完成关卡</div>
                <div class="mode-stat-value">{{ getCompletedCurrent() }}/{{ activityData.toy_battle_current.length }}
                </div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="mode-stat">
                <div class="mode-stat-label">最快用时</div>
                <div class="mode-stat-value">{{ getBestCurrentTime() }}秒</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="mode-stat">
                <div class="mode-stat-label">平均用时</div>
                <div class="mode-stat-value">{{ getAverageCurrentTime() }}秒</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="mode-stat">
                <div class="mode-stat-label">总加速次数</div>
                <div class="mode-stat-value">{{ getTotalAccelCount() }}</div>
              </div>
            </v-col>
          </v-row>

          <!-- 竞速关卡列表 -->
          <div class="challenge-list">
            <div v-for="challenge in activityData.toy_battle_current" :key="challenge.name" class="challenge-item">
              <div class="challenge-header">
                <span class="challenge-name">{{ challenge.name }}</span>
                <v-chip v-if="challenge.finished" small class="ml-2" color="success">已完成</v-chip>
              </div>
              <div class="challenge-stats">
                <span>最佳用时: {{ challenge.cost_time }}秒</span>
                <span>加速次数: {{ challenge.accel_count }}</span>
              </div>
              <div class="time-comparison">
                <div class="time-label">用时表现</div>
                <div class="time-bar">
                  <div class="time-fill" :style="{ width: getTimePercentage(challenge.cost_time) + '%' }"
                    :class="{ 'good-time': challenge.cost_time <= 70, 'average-time': challenge.cost_time > 70 && challenge.cost_time <= 80, 'slow-time': challenge.cost_time > 80 }">
                  </div>
                </div>
                <div class="time-value">{{ challenge.cost_time }}秒</div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- 阵营挑战模式 -->
      <v-card v-if="activityData.toy_battle_camp && activityData.toy_battle_camp.length > 0"
        class="game-mode-card mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon left>mdi-flag</v-icon>
          效能模拟实战环
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6" md="3">
              <div class="mode-stat">
                <div class="mode-stat-label">完成阵营</div>
                <div class="mode-stat-value">{{ getCompletedCamps() }}/{{ activityData.toy_battle_camp.length }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="mode-stat">
                <div class="mode-stat-label">总挑战数</div>
                <div class="mode-stat-value">{{ getTotalCampChallenges() }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="mode-stat">
                <div class="mode-stat-label">完成挑战</div>
                <div class="mode-stat-value">{{ getCompletedCampChallenges() }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="mode-stat">
                <div class="mode-stat-label">阵营完成率</div>
                <div class="mode-stat-value">{{ getCampCompletionRate() }}%</div>
              </div>
            </v-col>
          </v-row>

          <!-- 阵营挑战列表 -->
          <div class="camp-list">
            <div v-for="camp in activityData.toy_battle_camp" :key="camp.name" class="camp-item">
              <div class="camp-header">
                <span class="camp-name">{{ camp.name }}</span>
                <v-chip small class="ml-2" :color="getCampColor(camp)">
                  {{ getCampCompletion(camp) }}/{{ camp.list.length }} 完成
                </v-chip>
              </div>
              <div class="camp-challenges">
                <div v-for="challenge in camp.list" :key="challenge.id" class="camp-challenge">
                  <v-icon :color="challenge.finished ? 'success' : 'grey'" small>
                    {{ challenge.finished ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                  </v-icon>
                  <span class="challenge-id">挑战 {{ challenge.id }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ToyBattleActivity',
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
      let total = 0;
      if (this.activityData.toy_battle_qte) total += this.activityData.toy_battle_qte.length;
      if (this.activityData.toy_battle_current) total += this.activityData.toy_battle_current.length;
      if (this.activityData.toy_battle_camp) {
        total += this.activityData.toy_battle_camp.reduce((sum, camp) => sum + camp.list.length, 0);
      }
      return total;
    },

    // 获取已完成挑战数
    getCompletedChallenges() {
      let completed = 0;
      if (this.activityData.toy_battle_qte) {
        completed += this.activityData.toy_battle_qte.filter(challenge => challenge.finished).length;
      }
      if (this.activityData.toy_battle_current) {
        completed += this.activityData.toy_battle_current.filter(challenge => challenge.finished).length;
      }
      if (this.activityData.toy_battle_camp) {
        completed += this.activityData.toy_battle_camp.reduce((sum, camp) => {
          return sum + camp.list.filter(challenge => challenge.finished).length;
        }, 0);
      }
      return completed;
    },

    // 获取完成率
    getCompletionRate() {
      const total = this.getTotalChallenges();
      const completed = this.getCompletedChallenges();
      if (total === 0) return 0;
      return Math.round((completed / total) * 100);
    },

    // 获取最高分数
    getMaxScore() {
      let maxScore = 0;
      if (this.activityData.toy_battle_qte) {
        const qteScores = this.activityData.toy_battle_qte.map(challenge => challenge.best_score);
        if (qteScores.length > 0) {
          maxScore = Math.max(maxScore, ...qteScores);
        }
      }
      return maxScore;
    },

    // QTE相关方法
    getCompletedQTE() {
      if (!this.activityData.toy_battle_qte) return 0;
      return this.activityData.toy_battle_qte.filter(challenge => challenge.finished).length;
    },

    getMaxQTEScore() {
      if (!this.activityData.toy_battle_qte || this.activityData.toy_battle_qte.length === 0) return 0;
      return Math.max(...this.activityData.toy_battle_qte.map(challenge => challenge.best_score));
    },

    getAverageQTEAccuracy() {
      if (!this.activityData.toy_battle_qte || this.activityData.toy_battle_qte.length === 0) return 0;
      const accuracies = this.activityData.toy_battle_qte.map(challenge => challenge.accuracy_percent / 100);
      return (accuracies.reduce((a, b) => a + b, 0) / accuracies.length).toFixed(2);
    },

    getTotalQTERight() {
      if (!this.activityData.toy_battle_qte) return 0;
      return this.activityData.toy_battle_qte.reduce((total, challenge) => total + challenge.right_num, 0);
    },

    // 竞速相关方法
    getCompletedCurrent() {
      if (!this.activityData.toy_battle_current) return 0;
      return this.activityData.toy_battle_current.filter(challenge => challenge.finished).length;
    },

    getBestCurrentTime() {
      if (!this.activityData.toy_battle_current || this.activityData.toy_battle_current.length === 0) return 0;
      return Math.min(...this.activityData.toy_battle_current.map(challenge => challenge.cost_time));
    },

    getAverageCurrentTime() {
      if (!this.activityData.toy_battle_current || this.activityData.toy_battle_current.length === 0) return 0;
      const times = this.activityData.toy_battle_current.map(challenge => challenge.cost_time);
      return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    },

    getTotalAccelCount() {
      if (!this.activityData.toy_battle_current) return 0;
      return this.activityData.toy_battle_current.reduce((total, challenge) => total + challenge.accel_count, 0);
    },

    // 阵营相关方法
    getCompletedCamps() {
      if (!this.activityData.toy_battle_camp) return 0;
      return this.activityData.toy_battle_camp.filter(camp =>
        camp.list.every(challenge => challenge.finished)
      ).length;
    },

    getTotalCampChallenges() {
      if (!this.activityData.toy_battle_camp) return 0;
      return this.activityData.toy_battle_camp.reduce((sum, camp) => sum + camp.list.length, 0);
    },

    getCompletedCampChallenges() {
      if (!this.activityData.toy_battle_camp) return 0;
      return this.activityData.toy_battle_camp.reduce((sum, camp) => {
        return sum + camp.list.filter(challenge => challenge.finished).length;
      }, 0);
    },

    getCampCompletionRate() {
      const total = this.getTotalCampChallenges();
      const completed = this.getCompletedCampChallenges();
      if (total === 0) return 0;
      return Math.round((completed / total) * 100);
    },

    getCampCompletion(camp) {
      return camp.list.filter(challenge => challenge.finished).length;
    },

    getCampColor(camp) {
      const completed = this.getCampCompletion(camp);
      const total = camp.list.length;
      if (completed === total) return 'success';
      if (completed > 0) return 'warning';
      return 'grey';
    },

    // 辅助方法
    getAccuracyColor(accuracy) {
      if (accuracy >= 95) return 'success';
      if (accuracy >= 90) return 'warning';
      return 'error';
    },

    getTimePercentage(time) {
      // 假设最佳时间为60秒，最差时间为100秒
      const minTime = 60;
      const maxTime = 100;
      const normalized = Math.max(minTime, Math.min(time, maxTime));
      return ((maxTime - normalized) / (maxTime - minTime)) * 100;
    }
  }
}
</script>

<style scoped>
.toy-battle-activity {
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
  background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
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

.game-mode-card {
  border-left: 4px solid #ff9ff3;
}

.mode-stat {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.mode-stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.mode-stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.challenge-list {
  margin-top: 20px;
}

.challenge-item {
  padding: 16px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #ff9ff3;
}

.challenge-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.challenge-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.challenge-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.accuracy-bar {
  margin-top: 12px;
}

.accuracy-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.accuracy-value {
  font-size: 12px;
  text-align: right;
  color: #666;
}

.time-comparison {
  margin-top: 12px;
}

.time-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.time-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.time-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.good-time {
  background: linear-gradient(90deg, #4cd964, #34e7e4);
}

.average-time {
  background: linear-gradient(90deg, #ffa801, #ffd32a);
}

.slow-time {
  background: linear-gradient(90deg, #ff3f34, #ff5e57);
}

.time-value {
  font-size: 12px;
  text-align: right;
  color: #666;
}

.camp-list {
  margin-top: 20px;
}

.camp-item {
  padding: 16px;
  margin-bottom: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #ff9ff3;
}

.camp-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.camp-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.camp-challenges {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.camp-challenge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  font-size: 14px;
}

.challenge-id {
  color: #666;
}

@media (max-width: 768px) {
  .toy-battle-activity {
    padding: 10px;
  }

  .challenge-stats {
    flex-direction: column;
    gap: 8px;
  }

  .camp-challenges {
    grid-template-columns: 1fr;
  }
}
</style>