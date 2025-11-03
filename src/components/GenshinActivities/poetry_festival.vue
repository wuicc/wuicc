<template>
  <div class="poetry-festival">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="activity-content">
      <!-- 活动基本信息卡片 -->
      <div class="info-card">
        <h3>游水酝诗籍</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">灵感喷激挑战</span>
            <span class="stat-value">{{ getCompletedInspirationSpurt() }}/{{ getTotalInspirationSpurt() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">画意修复关卡</span>
            <span class="stat-value">{{ getCompletedPaintingRepair() }}/{{ getTotalPaintingRepair() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">百步礼掷关卡</span>
            <span class="stat-value">{{ getCompletedPitchPot() }}/{{ getTotalPitchPot() }}</span>
          </div>
        </div>
      </div>

      <!-- 百步礼掷 -->
      <div class="section">
        <h4>百步礼掷</h4>
        <div class="pitch-pot-grid">
          <div v-for="challenge in activityData.pitch_pot" :key="challenge.id" class="pitch-pot-card">
            <div class="challenge-header">
              <span class="challenge-name">{{ challenge.name }}</span>
              <span :class="['status-badge', challenge.finished ? 'completed' : 'pending']">
                {{ challenge.finished ? '已完成' : '未完成' }}
              </span>
            </div>
            <div class="challenge-info">
              <div class="info-item">
                <span class="label">用时：</span>
                <span class="value">{{ formatTime(challenge.cost_time) }}</span>
              </div>
              <div class="info-item">
                <span class="label">分数：</span>
                <span class="value">{{ challenge.score }}</span>
              </div>
              <div class="info-item">
                <span class="label">模式：</span>
                <span class="value">{{ challenge.is_mp ? '多人' : '单人' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 灵感喷激挑战 -->
      <div class="section">
        <h4>灵感喷激</h4>
        <div class="challenges-grid">
          <div v-for="challenge in activityData.inspiration_spurt" :key="challenge.id" class="challenge-card">
            <div class="challenge-header">
              <span class="challenge-name">{{ challenge.name }}</span>
              <span :class="['status-badge', challenge.finished ? 'completed' : 'pending']">
                {{ challenge.finished ? '已完成' : '未完成' }}
              </span>
            </div>
            <div class="challenge-info">
              <div class="info-item">
                <span class="label">挑战用时：</span>
                <span class="value">{{ formatTime(challenge.cost_time) }}</span>
              </div>
              <div class="info-item">
                <span class="label">最高分数：</span>
                <span class="value">{{ challenge.score }}</span>
              </div>
            </div>
            <div class="challenge-desc">
              {{ challenge.desc }}
            </div>
            <div class="avatars-grid">
              <div v-for="avatar in challenge.avatars" :key="avatar.id" class="avatar-item">
                <img :src="avatar.icon" :alt="avatar.id" class="avatar-icon" />
                <div class="avatar-info">
                  <span class="avatar-level">Lv.{{ avatar.level }}</span>
                  <span :class="['avatar-rarity', 'rarity-' + avatar.rarity]">{{ avatar.rarity }}★</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 画意修复 -->
      <div class="section">
        <h4>画意修复</h4>
        <div class="painting-stages">
          <div v-for="stage in activityData.painting_repair" :key="stage.stage_id" class="stage-card">
            <h5>{{ stage.name }}</h5>
            <div class="painting-list">
              <div v-for="painting in stage.list" :key="painting.level_id" class="painting-item">
                <img :src="painting.icon" :alt="painting.name" class="painting-icon" />
                <div class="painting-info">
                  <span class="painting-name">{{ painting.name }}</span>
                  <span :class="['status-badge', painting.finished ? 'completed' : 'pending']">
                    {{ painting.finished ? '已完成' : '未完成' }}
                  </span>
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
  name: 'PoetryFestival',
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
    // 获取灵感喷激挑战总数
    getTotalInspirationSpurt() {
      return this.activityData.inspiration_spurt?.length || 0
    },
    // 获取已完成的灵感喷激挑战数
    getCompletedInspirationSpurt() {
      return this.activityData.inspiration_spurt?.filter(challenge => challenge.finished).length || 0
    },
    // 获取画意修复关卡总数
    getTotalPaintingRepair() {
      let total = 0
      this.activityData.painting_repair?.forEach(stage => {
        total += stage.list?.length || 0
      })
      return total
    },
    // 获取已完成的画意修复关卡数
    getCompletedPaintingRepair() {
      let completed = 0
      this.activityData.painting_repair?.forEach(stage => {
        stage.list?.forEach(painting => {
          if (painting.finished) completed++
        })
      })
      return completed
    },
    // 获取百步礼掷关卡总数
    getTotalPitchPot() {
      return this.activityData.pitch_pot?.length || 0
    },
    // 获取已完成的百步礼掷关卡数
    getCompletedPitchPot() {
      return this.activityData.pitch_pot?.filter(challenge => challenge.finished).length || 0
    },
    // 获取最高分数
    getMaxScore() {
      const inspirationScores = this.activityData.inspiration_spurt?.map(challenge => challenge.score) || []
      const pitchPotScores = this.activityData.pitch_pot?.map(challenge => challenge.score) || []
      const allScores = [...inspirationScores, ...pitchPotScores]
      return allScores.length > 0 ? Math.max(...allScores) : 0
    },
    // 格式化时间（秒转换为分:秒）
    formatTime(seconds) {
      if (!seconds) return '0:00'
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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
.poetry-festival {
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

.section {
  margin-bottom: 32px;
}

.section h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 8px;
}

.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.challenge-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.challenge-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.challenge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.challenge-name {
  font-weight: 600;
  color: #333;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
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

.challenge-info {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: #666;
}

.value {
  font-weight: 600;
  color: #333;
}

.challenge-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 16px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
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
  background: #f8f9fa;
  border-radius: 6px;
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

.painting-stages {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.stage-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
}

.stage-card h5 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.painting-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.painting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.painting-icon {
  width: 50px;
  height: 50px;
  border-radius: 6px;
}

.painting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.painting-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.pitch-pot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.pitch-pot-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
}

@media (max-width: 768px) {
  .poetry-festival {
    padding: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .challenges-grid {
    grid-template-columns: 1fr;
  }

  .painting-stages {
    grid-template-columns: 1fr;
  }

  .pitch-pot-grid {
    grid-template-columns: 1fr;
  }
}
</style>