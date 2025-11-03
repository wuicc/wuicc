<template>
  <div class="lantern-v3-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 活动内容 -->
    <div v-else class="activity-content">
      <!-- 活动基本信息卡片 -->
      <div class="activity-info-cards">
        <div class="info-card">
          <h3>光焰蹈跃</h3>
          <div class="info-content">
            <p>完成状态: {{ activityData.race?.is_completed ? '已完成' : '未完成' }}</p>
            <p>挑战数量: {{ activityData.race?.records?.length || 0 }}</p>
            <p>总分数: {{ getTotalRaceScore() }}</p>
          </div>
        </div>
        
        <div class="info-card">
          <h3>纸映成戏</h3>
          <div class="info-content">
            <p>完成状态: {{ activityData.puzzle?.is_completed ? '已完成' : '未完成' }}</p>
            <p>谜题数量: {{ activityData.puzzle?.records?.length || 0 }}</p>
            <p>总用时: {{ getTotalPuzzleTime() }}秒</p>
          </div>
        </div>
        
        <div class="info-card">
          <h3>烟海梭巡</h3>
          <div class="info-content">
            <p>完成状态: {{ activityData.boat?.is_completed ? '已完成' : '未完成' }}</p>
            <p>总分数: {{ activityData.boat?.total_score || 0 }}</p>
            <p>胜场数: {{ activityData.boat?.total_win_race || 0 }}</p>
          </div>
        </div>
        
        <div class="info-card">
          <h3>佳节诸事</h3>
          <div class="info-content">
            <p>完成状态: {{ activityData.mission?.is_completed ? '已完成' : '未完成' }}</p>
            <p>任务数量: {{ activityData.mission?.records?.length || 0 }}</p>
            <p>昵称: {{ activityData.mission?.nickname || '未知' }}</p>
          </div>
        </div>
      </div>

      <!-- 竞速挑战记录 -->
      <div class="section">
        <h2>光焰蹈跃</h2>
        <div class="race-records">
          <div v-for="record in activityData.race?.records || []" :key="record.id" class="race-record">
            <div class="record-header">
              <h3>{{ record.name }}</h3>
              <img :src="record.medal" :alt="record.name" class="medal-icon" />
            </div>
            <div class="record-details">
              <p>通关用时: {{ record.cost_time }}秒</p>
              <p>最高分数: {{ record.score }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 灯谜解谜记录 -->
      <div class="section">
        <h2>纸映成戏</h2>
        <div class="puzzle-records">
          <div v-for="puzzle in activityData.puzzle?.records || []" :key="puzzle.id" class="puzzle-record">
            <div class="puzzle-header">
              <h3>{{ puzzle.name }}</h3>
              <p class="puzzle-status">{{ puzzle.is_finished ? '已完成' : '未完成' }}</p>
            </div>
            <div class="puzzle-content">
              <div class="puzzle-info">
                <p class="puzzle-desc">{{ puzzle.desc }}</p>
                <p>用时: {{ puzzle.cost_time }}秒</p>
                <!-- <p>步数: {{ puzzle.step }}</p> -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 行舟活动统计 -->
      <div class="section">
        <h2>烟海梭巡</h2>
        <div class="boat-stats">
          <div class="stat-item">
            <span class="stat-label">当前累计得分</span>
            <span class="stat-value">{{ activityData.boat?.total_score || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">单局最高得分</span>
            <span class="stat-value">{{ activityData.boat?.max_race_score || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总胜场数</span>
            <span class="stat-value">{{ activityData.boat?.total_win_race || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">存活时间超过30s场数</span>
            <span class="stat-value">{{ activityData.boat?.total_survive_race || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">浪船损毁不超过5次场数</span>
            <span class="stat-value">{{ activityData.boat?.total_safe_race || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 剧情任务记录 -->
      <div class="section">
        <h2>佳节诸事</h2>
        <div class="mission-records">
          <div v-for="mission in activityData.mission?.records || []" :key="mission.id" class="mission-record">
            <p class="mission-content">{{ mission.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LanternV3',
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
    // 计算竞速挑战总分数
    getTotalRaceScore() {
      if (!this.activityData.race?.records) return 0;
      return this.activityData.race.records.reduce((total, record) => total + record.score, 0);
    },
    
    // 计算灯谜解谜总用时
    getTotalPuzzleTime() {
      if (!this.activityData.puzzle?.records) return 0;
      return this.activityData.puzzle.records.reduce((total, puzzle) => total + puzzle.cost_time, 0);
    },
    
    // 移除颜色标签
    removeColorTags(text) {
      if (!text) return '';
      return text.replace(/<[^>]*>/g, '');
    }
  }
}
</script>

<style scoped>
.lantern-v3-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.activity-info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.info-card h3 {
  margin: 0 0 15px 0;
  font-size: 1.2em;
}

.info-content p {
  margin: 5px 0;
  font-size: 0.9em;
}

.section {
  /* margin-bottom: 40px; */
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section h2 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.race-records {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.race-record {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-header h3 {
  margin: 0;
  color: #2c3e50;
}

.medal-icon {
  width: 30px;
  height: 30px;
}

.record-details p {
  margin: 5px 0;
  color: #666;
}

.puzzle-records {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.puzzle-record {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.puzzle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.puzzle-header h3 {
  margin: 0;
  color: #2c3e50;
}

.puzzle-status {
  background: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}

.puzzle-content {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.puzzle-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.puzzle-info {
  flex: 1;
}

.puzzle-desc {
  font-style: italic;
  color: #666;
  margin-bottom: 10px;
}

.boat-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.stat-item {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.9em;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 1.2em;
  font-weight: bold;
  color: #2c3e50;
}

.mission-records {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.mission-record {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #ff6b6b;
}

.mission-content {
  margin: 0;
  color: #2c3e50;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .activity-info-cards {
    grid-template-columns: 1fr;
  }
  
  .race-records,
  .puzzle-records {
    grid-template-columns: 1fr;
  }
  
  .puzzle-content {
    flex-direction: column;
  }
  
  .puzzle-image {
    align-self: center;
  }
}
</style>