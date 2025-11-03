<template>
  <div class="lantern-v4-container">
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
          <h3>纸影寻肴</h3>
          <div class="info-content">
            <p>开放状态: {{ activityData.push_box.is_open ? '已开放' : '未开放' }}</p>
            <p>关卡数量: {{ activityData.push_box.records.length }}</p>
            <p>完成关卡: {{ getCompletedPushBoxCount() }}</p>
          </div>
        </div>
        
        <div class="info-card">
          <h3>瑞兽欢跃</h3>
          <div class="info-content">
            <p>开放状态: {{ activityData.party_lion.is_open ? '已开放' : '未开放' }}</p>
            <p>活动数量: {{ activityData.party_lion.records.length }}</p>
            <p>总分数: {{ activityData.party_lion.party_lion_score }}</p>
          </div>
        </div>
        
        <div class="info-card">
          <h3>熠光云行</h3>
          <div class="info-content">
            <p>开放状态: {{ activityData.carp_jump.is_open ? '已开放' : '未开放' }}</p>
            <p>关卡数量: {{ activityData.carp_jump.records.length }}</p>
            <p>平均分数: {{ getAverageCarpJumpScore() }}</p>
          </div>
        </div>
      </div>

      <!-- 推箱子解谜记录 -->
      <div class="section">
        <h2>纸影寻肴</h2>
        <div class="push-box-records">
          <div v-for="record in activityData.push_box.records" :key="record.name" class="push-box-record">
            <div class="record-header">
              <h3>{{ record.name }}</h3>
              <span :class="['status-badge', record.finished ? 'completed' : 'pending']">
                {{ record.finished ? '完成挑战' : '未完成挑战' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 舞狮活动记录 -->
      <div class="section">
        <h2>瑞兽欢跃</h2>
        <div class="party-lion-records">
          <div v-for="record in activityData.party_lion.records" :key="record.name" class="party-lion-record">
            <div class="record-header">
              <h3>{{ record.name }}</h3>
              <span :class="['data-status', record.exist_data ? 'has-data' : 'no-data']">
                {{ record.exist_data ? '有数据' : '无数据' }}
              </span>
            </div>
            <div class="record-stats">
              <div class="stat-item">
                <span class="stat-label">累计完成次数</span>
                <span class="stat-value">{{ record.finish_count }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">获胜场数</span>
                <span class="stat-value">{{ record.win_count }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">至少弹开5次其他玩家</span>
                <span class="stat-value">{{ record.attack_count }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">持有茶饼时间达到5s</span>
                <span class="stat-value">{{ record.carry_cake_count }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">损失清淡值不超过60</span>
                <span class="stat-value">{{ record.manifest_count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 鲤鱼跃龙门记录 -->
      <div class="section">
        <h2>熠光云行</h2>
        <div class="carp-jump-records">
          <div v-for="record in activityData.carp_jump.records" :key="record.name" class="carp-jump-record">
            <div class="record-header">
              <h3>{{ record.name }}</h3>
              <span :class="['data-status', record.exist_data ? 'has-data' : 'no-data']">
                {{ record.exist_data ? '有数据' : '无数据' }}
              </span>
            </div>
            <div class="record-stats">
              <div class="stat-item">
                <span class="stat-label">最佳分数:</span>
                <span class="stat-value">{{ record.best_score }}</span>
              </div>
              <!-- <div class="stat-item">
                <span class="stat-label">分数排名:</span>
                <span class="stat-value">{{ getScoreRankText(record.score_rank) }}</span>
              </div> -->
              <div class="stat-item">
                <span class="stat-label">剩余时间:</span>
                <span class="stat-value">{{ formatTimeToMinutesSeconds(record.left_time) }}</span>
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
  name: 'LanternV4',
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
    // 计算完成的推箱子关卡数量
    getCompletedPushBoxCount() {
      if (!this.activityData.push_box.records) return 0;
      return this.activityData.push_box.records.filter(record => record.finished).length;
    },
    
    // 计算鲤鱼跃龙门的平均分数
    getAverageCarpJumpScore() {
      if (!this.activityData.carp_jump.records) return 0;
      const records = this.activityData.carp_jump.records.filter(record => record.exist_data);
      if (records.length === 0) return 0;
      const totalScore = records.reduce((sum, record) => sum + record.best_score, 0);
      return Math.round(totalScore / records.length);
    },
    
    // 获取分数排名文本
    getScoreRankText(rank) {
      const rankMap = {
        1: '第一名',
        2: '第二名',
        3: '第三名',
        4: '第四名',
        5: '第五名'
      };
      return rankMap[rank] || `第${rank}名`;
    },
    
    // 移除颜色标签
    removeColorTags(text) {
      if (!text) return '';
      return text.replace(/<[^>]*>/g, '');
    },
    
    // 将秒数转换为分秒格式
    formatTimeToMinutesSeconds(seconds) {
      if (!seconds || seconds <= 0) return '0秒';
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (minutes === 0) {
        return `${remainingSeconds}秒`;
      } else if (remainingSeconds === 0) {
        return `${minutes}分`;
      } else {
        return `${minutes}分${remainingSeconds}秒`;
      }
    }
  }
}
</script>

<style scoped>
.lantern-v4-container {
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
}

.info-card {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
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
  margin-bottom: 8px;
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section h2 {
  color: #2c3e50;
  border-bottom: 2px solid #ff6b6b;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.push-box-records {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.push-box-record {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #ff6b6b;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1em;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: bold;
}

.status-badge.completed {
  background: #28a745;
  color: white;
}

.status-badge.pending {
  background: #ffc107;
  color: #212529;
}

.party-lion-records,
.carp-jump-records {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.party-lion-record,
.carp-jump-record {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.record-stats {
  margin-top: 15px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.stat-label {
  font-size: 0.85em;
  color: #666;
}

.stat-value {
  font-weight: bold;
  color: #2c3e50;
}

.data-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: bold;
}

.data-status.has-data {
  background: #28a745;
  color: white;
}

.data-status.no-data {
  background: #6c757d;
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .activity-info-cards {
    grid-template-columns: 1fr;
  }
  
  .push-box-records {
    grid-template-columns: 1fr;
  }
  
  .party-lion-records,
  .carp-jump-records {
    grid-template-columns: 1fr;
  }
  
  .record-stats {
    grid-template-columns: 1fr;
  }
}
</style>