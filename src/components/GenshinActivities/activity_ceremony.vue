<template>
  <div class="activity-ceremony">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!activityData.exists_data" class="no-data">暂无数据</div>
    <div v-else class="activity-content">
      <!-- 活动基本信息卡片 -->
      <div class="activity-stats">
        <div class="stat-card">
          <h3>完成度</h3>
          <p class="stat-value">{{ completionRate }}%</p>
        </div>
        <div class="stat-card">
          <h3>挑战数</h3>
          <p class="stat-value">{{ challengesCount }}</p>
        </div>
        <div class="stat-card">
          <h3>平均分数</h3>
          <p class="stat-value">{{ averageScore }}</p>
        </div>
      </div>

      <!-- 游灵觅聚统计 -->
      <div class="section" v-if="activityData.ghost_list && activityData.ghost_list.length > 0">
        <h2>游灵觅聚统计</h2>
        <div class="ghost-stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👻</div>
            <div class="stat-content">
              <span class="stat-title">游灵数量</span>
              <span class="stat-value">{{ activityData.ghost_list.length }}</span>
              <span class="stat-subtitle">个游灵</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🌟</div>
            <div class="stat-content">
              <span class="stat-title">最高分数</span>
              <span class="stat-value">{{ maxGhostScore }}</span>
              <span class="stat-subtitle">分</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <span class="stat-title">完成数量</span>
              <span class="stat-value">{{ completedGhosts }}</span>
              <span class="stat-subtitle">个完成</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 游灵觅聚记录 -->
      <div class="section" v-if="activityData.ghost_list && activityData.ghost_list.length > 0">
        <h2>迷途灵性的搜觅</h2>
        <div class="ghost-list">
          <div v-for="ghost in activityData.ghost_list" :key="ghost.id" class="ghost-card">
            <div class="ghost-header">
              <div class="ghost-title">
                <h3>{{ ghost.name }}</h3>
              </div>
              <div class="ghost-scores">
                <div class="score-info">
                  <span class="score-label">最佳记录</span>
                  <span class="score-value">{{ ghost.score || 0 }}</span>
                </div>
              </div>
            </div>
            
            <div class="ghost-avatar" v-if="ghost.avatar_icon">
              <img :src="ghost.avatar_icon" :alt="ghost.name" class="avatar-icon">
            </div>
          </div>
        </div>
      </div>

      <!-- 战斗挑战记录 -->
      <div class="section" v-if="activityData.battle_list && activityData.battle_list.length > 0">
        <h2>斥逐与驱散恶客</h2>
        <div class="battle-list">
          <div v-for="battle in activityData.battle_list" :key="battle.id" class="battle-card">
            <div class="battle-header">
              <div class="battle-title">
                <h3>{{ battle.name }}</h3>
                <div class="medal-badge">
                  <span class="medal-icon">🏅</span>
                  <span class="medal-level">{{ getMedalText(battle.medal) }}</span>
                </div>
              </div>
              <div class="battle-scores">
                <div class="score-info">
                  <span class="score-label">分数:</span>
                  <span class="score-value">{{ battle.score || 0 }}</span>
                </div>
              </div>
            </div>
            
            <!-- 角色阵容 -->
            <div class="avatars-section" v-if="battle.avatars && battle.avatars.length > 0">
              <h4>角色阵容</h4>
              <div class="avatars-list">
                <div v-for="avatar in battle.avatars" :key="avatar.id" class="avatar-item">
                  <img :src="avatar.icon" :alt="`角色${avatar.id}`" class="avatar-icon">
                  <div class="avatar-info">
                    <span class="avatar-rarity">{{ avatar.rarity }}★</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 暝视片段记录 -->
      <div class="section" v-if="activityData.doodle_list && activityData.doodle_list.length > 0">
        <h2>破碎旧录之规复</h2>
        <div class="doodle-list">
          <div v-for="doodle in activityData.doodle_list" :key="doodle.id" class="doodle-card">
            <div class="doodle-header">
              <div class="doodle-image">
                <img :src="doodle.icon" :alt="doodle.name" class="doodle-icon">
              </div>
              <div class="doodle-info">
                <h3>{{ doodle.name }}</h3>
                <div class="doodle-stats">
                  <div class="stat-item">
                    <span class="stat-label">解锁状态:</span>
                    <span class="stat-value">{{ doodle.is_unlock ? '已解锁' : '未解锁' }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">最短用时:</span>
                    <span class="stat-value">{{ formatTime(doodle.cost_time) }}</span>
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
  name: 'ActivityCeremony',
  props: {
    activityData: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    completionRate() {
      // 基于所有模块的完成情况计算总体完成度
      let completed = 0
      let total = 0
      
      if (this.activityData.ghost_list) {
        completed += this.activityData.ghost_list.filter(g => g.has_data).length
        total += this.activityData.ghost_list.length
      }
      
      if (this.activityData.battle_list) {
        completed += this.activityData.battle_list.filter(b => b.has_data).length
        total += this.activityData.battle_list.length
      }
      
      if (this.activityData.doodle_list) {
        completed += this.activityData.doodle_list.filter(d => d.has_data).length
        total += this.activityData.doodle_list.length
      }
      
      return total > 0 ? Math.round((completed / total) * 100) : 0
    },
    challengesCount() {
      // 计算所有模块的总挑战数
      let count = 0
      if (this.activityData.ghost_list) count += this.activityData.ghost_list.length
      if (this.activityData.battle_list) count += this.activityData.battle_list.length
      if (this.activityData.doodle_list) count += this.activityData.doodle_list.length
      return count
    },
    averageScore() {
      // 计算所有模块的平均分数
      let totalScore = 0
      let count = 0
      
      if (this.activityData.ghost_list) {
        this.activityData.ghost_list.forEach(ghost => {
          if (ghost.score) {
            totalScore += ghost.score
            count++
          }
        })
      }
      
      if (this.activityData.battle_list) {
        this.activityData.battle_list.forEach(battle => {
          if (battle.score) {
            totalScore += battle.score
            count++
          }
        })
      }
      
      return count > 0 ? Math.round(totalScore / count) : 0
    },
    maxGhostScore() {
      if (!this.activityData.ghost_list || this.activityData.ghost_list.length === 0) return 0
      return Math.max(...this.activityData.ghost_list.map(g => g.score || 0))
    },
    avgGhostScore() {
      if (!this.activityData.ghost_list || this.activityData.ghost_list.length === 0) return 0
      const scores = this.activityData.ghost_list.map(g => g.score || 0).filter(s => s > 0)
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    },
    completedGhosts() {
      if (!this.activityData.ghost_list) return 0
      return this.activityData.ghost_list.filter(g => g.has_data).length
    }
  },
  methods: {
    getMedalText(medal) {
      const medalMap = {
        1: '铜牌',
        2: '银牌',
        3: '金牌',
        4: '白金'
      }
      return medalMap[medal] || '未评级'
    },
    formatTime(seconds) {
      if (!seconds || seconds === 0) return '0秒'
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      if (minutes === 0) {
        return `${remainingSeconds}秒`
      } else if (remainingSeconds === 0) {
        return `${minutes}分`
      } else {
        return `${minutes}分${remainingSeconds}秒`
      }
    }
  }
}
</script>

<style scoped>
.activity-ceremony {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.activity-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #495057;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #212529;
  margin: 0;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
  margin: 5px 0 0 0;
}

.section {
  margin-bottom: 40px;
}

.section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: #212529;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 10px;
}

.ghost-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.ghost-stats-grid .stat-card {
  display: flex;
  align-items: center;
  text-align: left;
  padding: 15px;
}

.stat-icon {
  font-size: 32px;
  margin-right: 15px;
}

.stat-content {
  flex: 1;
}

.stat-title {
  display: block;
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 5px;
}

.stat-subtitle {
  font-size: 12px;
  color: #adb5bd;
  margin-left: 5px;
}

.ghost-list, .battle-list, .doodle-list {
  display: grid;
  gap: 20px;
}

.ghost-card, .battle-card, .doodle-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ghost-header, .battle-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.ghost-title h3, .battle-title h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #212529;
}

.data-badge {
  display: inline-flex;
  align-items: center;
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.data-label {
  color: #6c757d;
  margin-right: 5px;
}

.data-status {
  font-weight: bold;
  color: #495057;
}

.ghost-scores, .battle-scores {
  display: flex;
  gap: 15px;
  align-items: center;
}

.score-info {
  text-align: right;
}

.score-label {
  display: block;
  font-size: 12px;
  color: #6c757d;
}

.score-value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #212529;
}

.medal-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #fff3cd;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ffeaa7;
}

.medal-icon {
  font-size: 16px;
}

.medal-level {
  font-size: 14px;
  font-weight: bold;
  color: #856404;
}

.ghost-avatar {
  text-align: center;
}

.avatar-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
}

.avatars-section {
  margin-top: 15px;
}

.avatars-section h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #495057;
}

.avatars-list {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-bottom: 5px;
}

.avatar-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.avatar-rarity {
  font-size: 11px;
  color: #ffd700;
  font-weight: bold;
}

.doodle-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.doodle-image {
  flex-shrink: 0;
}

.doodle-icon {
  width: 80px;
  height: 80px;
  border-radius: 12px;
}

.doodle-info {
  flex: 1;
}

.doodle-info h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #212529;
}

.doodle-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-label {
  font-size: 12px;
  color: #6c757d;
}

.stat-value {
  font-size: 14px;
  font-weight: bold;
  color: #495057;
}

@media (max-width: 768px) {
  .activity-ceremony {
    padding: 10px;
  }
  
  .activity-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .stat-card {
    padding: 15px;
  }
  
  .ghost-header, .battle-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .ghost-scores, .battle-scores {
    justify-content: space-between;
    width: 100%;
  }
  
  .doodle-header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .doodle-stats {
    grid-template-columns: 1fr;
  }
}
</style>