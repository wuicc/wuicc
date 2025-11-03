<template>
  <div class="goal-challenge">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="activity-content">
      <!-- 活动基本信息卡片 -->
      <div class="info-card">
        <h3>深念锐意旋步舞</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">总挑战数</span>
            <span class="stat-value">{{ getTotalChallenges() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已完成挑战</span>
            <span class="stat-value">{{ getCompletedChallenges() }}</span>
          </div>
        </div>
      </div>

      <!-- 挑战关卡列表 -->
      <div class="challenges-section">
        <div v-for="challenge in activityData.data" :key="challenge.id" class="challenge-card">
          <div class="challenge-header">
            <div class="challenge-title">
              <h4>{{ challenge.name }}</h4>
              <span :class="['status-badge', challenge.has_data ? 'completed' : 'pending']">
                {{ challenge.has_data ? '已完成' : '未完成' }}
              </span>
            </div>
            <div class="challenge-stats">
              <div class="stat">
                <span class="label">最高评分：</span>
                <span class="value">{{ challenge.total_score }}</span>
              </div>
              <div class="stat">
                <span class="label"></span>
                <span class="value">{{ formatScoreMultipleDesc(challenge.score_multiple_desc, challenge.score_multiple) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 挑战描述 -->
          <div class="challenge-desc">
            {{ formatDescription(challenge.desc) }}
          </div>
          
          <!-- 轮次列表 -->
          <div class="rounds-section">
            <h5>挑战轮次</h5>
            <div class="rounds-grid">
              <div v-for="(round, roundIndex) in challenge.rounds" :key="roundIndex" class="round-card">
                <div class="round-header">
                  <span class="round-title">轮次 {{ roundIndex + 1 }}</span>
                  <span class="round-score">{{ round.score }} 分</span>
                </div>
                <div class="avatars-grid">
                  <div v-for="avatar in round.avatars" :key="avatar.id" class="avatar-item">
                    <img :src="avatar.icon" :alt="avatar.id" class="avatar-icon" />
                    <div class="avatar-info">
                      <span class="avatar-level">Lv.{{ avatar.level }}</span>
                      <span :class="['avatar-rarity', 'rarity-' + avatar.rarity]">{{ avatar.rarity }}★</span>
                      <span v-if="avatar.is_trial" class="trial-badge">试用</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GoalChallenge',
  props: {
    activityData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: false
    }
  },
  methods: {
    // 获取总挑战数
    getTotalChallenges() {
      return this.activityData.data?.length || 0
    },
    // 获取已完成的挑战数
    getCompletedChallenges() {
      return this.activityData.data?.filter(challenge => challenge.has_data).length || 0
    },
    // 获取最高总分
    getMaxTotalScore() {
      const scores = this.activityData.data?.map(challenge => challenge.total_score) || []
      return scores.length > 0 ? Math.max(...scores) : 0
    },
    // 获取平均积分倍率
    getAverageScoreMultiple() {
      const multiples = this.activityData.data?.map(challenge => challenge.score_multiple) || []
      if (multiples.length === 0) return 0
      const sum = multiples.reduce((a, b) => a + b, 0)
      return (sum / multiples.length).toFixed(1)
    },
    // 格式化描述文本（处理换行符）
    formatDescription(desc) {
      if (!desc) return ''
      return desc.replace(/\\n/g, '\n')
    },
    // 格式化积分倍率描述（处理占位符{0}）
    formatScoreMultipleDesc(desc, multiple) {
      if (!desc) return `${multiple}x`
      return desc.replace('{0}', multiple)
    },
    // 获取稀有度颜色
    getRarityColor(rarity) {
      const colors = {
        4: '#a256e1',
        5: '#d5a658'
      }
      return colors[rarity] || '#6c757d'
    }
  }
}
</script>

<style scoped>
.goal-challenge {
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #666;
}

.info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-card h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.challenges-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.challenge-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.challenge-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.challenge-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.challenge-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.challenge-title h4 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #f8d7da;
  color: #721c24;
}

.challenge-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat .label {
  font-size: 12px;
  color: #666;
}

.stat .value {
  font-weight: 600;
  color: #333;
}

.challenge-desc {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  white-space: pre-line;
  line-height: 1.6;
  color: #555;
  font-size: 14px;
}

.rounds-section h5 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.rounds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.round-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
}

.round-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
}

.round-title {
  font-weight: 600;
  color: #333;
}

.round-score {
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.avatars-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.avatar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
}

.avatar-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.avatar-level {
  font-size: 12px;
  color: #666;
}

.avatar-rarity {
  font-size: 10px;
  font-weight: 600;
}

.rarity-4 {
  color: #a256e1;
}

.rarity-5 {
  color: #d5a658;
}

.trial-badge {
  background: #17a2b8;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .goal-challenge {
    padding: 12px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .challenge-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .challenge-stats {
    justify-content: flex-start;
  }
  
  .rounds-grid {
    grid-template-columns: 1fr;
  }
  
  .avatars-grid {
    grid-template-columns: 1fr;
  }
}
</style>