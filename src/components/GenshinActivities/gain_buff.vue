<template>
  <div class="gain-buff">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!activityData.exists_data" class="no-data">暂无数据</div>
    <div v-else class="activity-content">
      <!-- 活动基本信息卡片 -->
      <div class="activity-stats">
        <div class="stat-card">
          <h3>挑战关卡</h3>
          <p class="stat-value">{{ recordsCount }}</p>
          <p class="stat-label">总关卡数</p>
        </div>
        <div class="stat-card">
          <h3>最高难度</h3>
          <p class="stat-value">{{ maxDifficulty }}级</p>
          <p class="stat-label">难度等级</p>
        </div>
      </div>

      <!-- 挑战记录详情 -->
      <div class="section">
        <h2>挑战记录</h2>
        <div class="records-list">
          <div v-for="record in activityData.records" :key="record.id" class="record-card">
            <div class="record-header">
              <div class="record-title">
                <h3>{{ record.name }}</h3>
                <div class="difficulty-badge">
                  <span class="difficulty-label">难度:</span>
                  <span class="difficulty-level">{{ record.difficulty }}级</span>
                </div>
              </div>
              <div class="record-scores">
                <div class="score-info">
                  <span class="score-label">最佳分数</span>
                  <span class="score-value">{{ record.score }}</span>
                </div>
                <div class="medal-badge">
                  <span class="medal-icon">🏅</span>
                  <span class="medal-level">{{ record.medal }}星</span>
                </div>
              </div>
            </div>
            
            <!-- 目标进度 -->
            <div class="goal-progress">
              <h4>挑战目标</h4>
              <p class="goal-text">{{ record.goal }}</p>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: goalPercentage(record) + '%' }"></div>
                <span class="progress-text">{{ record.goal_progress }}/{{ record.goal_target }}</span>
              </div>
            </div>

            <!-- 阵容配置 -->
            <div class="lineup-section">
              <div class="lineup-group">
                <h4>上半层阵容</h4>
                <div class="avatars-list">
                  <div v-for="avatar in record.top_half_lineup" :key="avatar.id" class="avatar-item">
                    <img :src="avatar.icon" :alt="`角色${avatar.id}`" class="avatar-icon">
                    <div class="avatar-info">
                      <span class="avatar-rarity">{{ avatar.rarity }}★</span>
                      <span v-if="avatar.is_trial" class="trial-badge">试用</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="lineup-group">
                <h4>下半层阵容</h4>
                <div class="avatars-list">
                  <div v-for="avatar in record.bottom_half_lineup" :key="avatar.id" class="avatar-item">
                    <img :src="avatar.icon" :alt="`角色${avatar.id}`" class="avatar-icon">
                    <div class="avatar-info">
                      <span class="avatar-rarity">{{ avatar.rarity }}★</span>
                      <span v-if="avatar.is_trial" class="trial-badge">试用</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 增益效果 -->
            <div class="buffs-section">
              <h4>增益效果</h4>
              <div class="buffs-list">
                <div v-for="buff in record.buff_list" :key="buff.id" class="buff-item" :class="{ 'buff-unlocked': buff.is_unlock }">
                  <img :src="buff.icon" :alt="buff.desc" class="buff-icon">
                  <div class="buff-details">
                    <div class="buff-header">
                      <span class="buff-times">{{ buff.times }}次</span>
                      <span v-if="!buff.is_unlock" class="buff-locked">未解锁</span>
                      <span v-else class="buff-unlocked">已解锁</span>
                    </div>
                    <p class="buff-desc" v-html="buff.desc"></p>
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
  name: 'GainBuff',
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
  computed: {
    // 记录数量
    recordsCount() {
      return this.activityData.records?.length || 0
    },
    // 平均分数
    averageScore() {
      if (!this.activityData.records?.length) return 0
      const total = this.activityData.records.reduce((sum, record) => sum + record.score, 0)
      return Math.round(total / this.activityData.records.length)
    },
    // 最高难度
    maxDifficulty() {
      if (!this.activityData.records?.length) return 0
      return Math.max(...this.activityData.records.map(record => record.difficulty))
    },
    // 平均勋章等级
    averageMedal() {
      if (!this.activityData.records?.length) return 0
      const total = this.activityData.records.reduce((sum, record) => sum + record.medal, 0)
      return (total / this.activityData.records.length).toFixed(1)
    }
  },
  methods: {
    // 计算目标完成百分比
    goalPercentage(record) {
      if (!record.goal_target) return 0
      return Math.round((record.goal_progress / record.goal_target) * 100)
    }
  }
}
</script>

<style scoped>
.gain-buff {
  padding: 20px;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  font-size: 16px;
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
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #6c757d;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: #495057;
}

.stat-label {
  margin: 5px 0 0 0;
  font-size: 12px;
  color: #6c757d;
}

.section {
  margin-bottom: 30px;
}

.section h2 {
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 10px;
  margin-bottom: 20px;
  color: #495057;
}

.records-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
}

.record-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.record-title h3 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 16px;
}

.difficulty-badge {
  display: flex;
  align-items: center;
  background: #e2e3e5;
  color: #383d41;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.difficulty-label {
  margin-right: 4px;
}

.difficulty-level {
  font-weight: bold;
}

.record-scores {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.score-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-label {
  color: #6c757d;
  font-size: 14px;
}

.score-value {
  font-size: 18px;
  font-weight: bold;
  color: #495057;
}

.medal-badge {
  display: flex;
  align-items: center;
  background: #fff3cd;
  color: #856404;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.medal-icon {
  margin-right: 4px;
}

.medal-level {
  font-weight: bold;
}

.goal-progress {
  margin-bottom: 20px;
}

.goal-progress h4 {
  margin: 0 0 8px 0;
  color: #495057;
  font-size: 14px;
}

.goal-text {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #6c757d;
  line-height: 1.4;
}

.progress-bar {
  position: relative;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: bold;
  color: #495057;
}

.lineup-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.lineup-group h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #495057;
  text-align: center;
}

.avatars-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 8px;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-bottom: 5px;
}

.avatar-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 10px;
  color: #6c757d;
}

.avatar-rarity {
  font-weight: bold;
  color: orange;
}

.trial-badge {
  background: #17a2b8;
  color: white;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 8px;
  margin-top: 2px;
}

.buffs-section h4 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 14px;
}

.buffs-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
}

.buff-item {
  display: flex;
  align-items: flex-start;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #e9ecef;
}

.buff-item.buff-unlocked {
  background: #d4edda;
  border-color: #c3e6cb;
}

.buff-icon {
  width: 30px;
  height: 30px;
  margin-right: 10px;
  border-radius: 4px;
  background-color: #666;
}

.buff-details {
  flex: 1;
}

.buff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.buff-times {
  font-size: 12px;
  font-weight: bold;
  color: #495057;
}

.buff-locked {
  font-size: 10px;
  color: #dc3545;
  background: #f8d7da;
  padding: 2px 4px;
  border-radius: 2px;
}

.buff-unlocked {
  font-size: 10px;
  color: #155724;
  background: #d4edda;
  padding: 2px 4px;
  border-radius: 2px;
}

.buff-desc {
  margin: 0;
  font-size: 11px;
  color: #6c757d;
  line-height: 1.3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gain-buff {
    padding: 10px;
  }
  
  .activity-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .records-list {
    grid-template-columns: 1fr;
  }
  
  .record-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .record-scores {
    flex-direction: row;
    margin-top: 10px;
    align-self: flex-start;
  }
  
  .lineup-section {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .avatars-list {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .buffs-list {
    grid-template-columns: 1fr;
  }
}
</style>