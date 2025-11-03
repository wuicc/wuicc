<template>
  <div class="mist-trial-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 活动内容 -->
    <div v-else class="activity-content">
      <!-- 无数据提示 -->
      <div v-if="!activityData || !activityData.data || activityData.data.length === 0" class="no-data-container">
        <v-icon size="64" color="grey-lighten-1">mdi-calendar-blank</v-icon>
        <p class="mt-4 text-medium-emphasis">暂无迷雾试炼数据</p>
      </div>
      
      <!-- 活动基本信息卡片 -->
      <div v-else class="activity-info-cards">
        <div class="info-card">
          <h3>迷雾试炼</h3>
          <div class="info-content">
              <p>试炼数量: {{ activityData.data ? activityData.data.length : 0 }}</p>
              <p>最快完成时间 {{ formatTimeToMinSec(getMinFinishTime()) }}</p>
              <p>最强一击 {{ getMaxDamage() }}</p>
            </div>
        </div>

      </div>

      <!-- 迷雾试炼记录 -->
      <div class="section">
        <h2>迷雾试炼记录</h2>
        <div class="trial-records">
          <div v-for="trial in activityData.data" :key="trial.id" class="trial-record">
            <div class="record-header">
              <h3>{{ trial.name }}</h3>
              <div class="record-meta">
                <!-- <span class="trial-id">ID: {{ trial.id }}</span> -->
                <span class="record-value">{{ trial.level_record_desc }} {{ trial.level_record_val }} 次</span>
              </div>
            </div>
            
            <div class="record-details">
              <div class="stats-section">
                <div class="stat-item">
                  <span class="label">最快完成时间</span>
                  <span class="value">{{ formatTimeToMinSec(trial.min_finish_time) }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">最强一击</span>
                  <span class="value">{{ trial.max_damage }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">最低承伤</span>
                  <span class="value">{{ trial.min_damage_taken }}</span>
                </div>
              </div>
              
              <div class="avatars-section">
                <h4>试用角色阵容</h4>
                <div class="avatars-grid">
                  <div v-for="avatar in trial.avatars" :key="avatar.id" class="avatar-card">
                    <div class="avatar-image">
                      <img :src="avatar.icon" :alt="`角色 ${avatar.id}`" />
                      <div class="rarity-badge" :class="`rarity-${avatar.rarity}`">
                        {{ avatar.rarity }}★
                      </div>
                    </div>
                    <div class="avatar-info">
                      <div class="avatar-level">Lv.{{ avatar.level }}</div>
                      <div v-if="avatar.is_trial" class="trial-badge">试用</div>
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
  name: 'MistTrial',
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
    // 获取最快完成时间
    getMinFinishTime() {
      if (!this.activityData.data) return 0;
      return Math.min(...this.activityData.data.map(trial => trial.min_finish_time));
    },
    
    // 获取最强一击
    getMaxDamage() {
      if (!this.activityData.data) return 0;
      return Math.max(...this.activityData.data.map(trial => trial.max_damage));
    },
    
    // 计算平均完成时间
    getAverageFinishTime() {
      if (!this.activityData.data || this.activityData.data.length === 0) return 0;
      const times = this.activityData.data.map(trial => trial.min_finish_time);
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      return average.toFixed(1);
    },
    
    // 计算平均伤害
    getAverageDamage() {
      if (!this.activityData.data || this.activityData.data.length === 0) return 0;
      const damages = this.activityData.data.map(trial => trial.max_damage);
      const average = damages.reduce((sum, damage) => sum + damage, 0) / damages.length;
      return Math.round(average);
    },
    
    // 获取最低承伤值
    getMinDamageTaken() {
      if (!this.activityData.data) return 0;
      return Math.min(...this.activityData.data.map(trial => trial.min_damage_taken));
    },
    
    // 获取试用角色数量
    getTrialAvatarCount() {
      if (!this.activityData.data) return 0;
      let count = 0;
      this.activityData.data.forEach(trial => {
        count += trial.avatars.filter(avatar => avatar.is_trial).length;
      });
      return count;
    },
    
    // 获取指定稀有度的角色数量
    getRarityCount(rarity) {
      if (!this.activityData.data) return 0;
      let count = 0;
      this.activityData.data.forEach(trial => {
        count += trial.avatars.filter(avatar => avatar.rarity === rarity).length;
      });
      return count;
    },
    
    // 移除颜色标签
    removeColorTags(text) {
      if (!text) return '';
      return text.replace(/<[^>]*>/g, '');
    },
    
    // 将秒数转换为分秒格式
    formatTimeToMinSec(seconds) {
      if (!seconds || seconds === 0) return '0秒';
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes === 0) {
        return `${remainingSeconds}秒`;
      } else {
        return `${minutes}分${remainingSeconds}秒`;
      }
    }
  }
}
</script>

<style scoped>
.mist-trial-container {
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
  margin-bottom: 40px;
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section h2 {
  color: #2c3e50;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.trial-records {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.trial-record {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.trial-record:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.record-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1em;
}

.record-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.trial-id,
.record-value {
  font-size: 0.8em;
  color: #666;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stats-section {
  display: grid;
  grid-template-columns: 1fr;
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

.stat-item .label {
  font-size: 0.8em;
  color: #666;
}

.stat-item .value {
  font-weight: bold;
  color: #2c3e50;
}

.avatars-section h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1em;
}

.avatars-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.avatar-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.avatar-image {
  position: relative;
  width: 50px;
  height: 50px;
}

.avatar-image img {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
}

.rarity-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 0.6em;
  padding: 2px 4px;
  border-radius: 3px;
  color: white;
  font-weight: bold;
}

.rarity-5 {
  background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
}

.rarity-4 {
  background: linear-gradient(135deg, #c77dff 0%, #9d4edd 100%);
}

.avatar-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.avatar-level {
  font-size: 0.8em;
  color: #666;
}

.trial-badge {
  font-size: 0.7em;
  background: #28a745;
  color: white;
  padding: 1px 4px;
  border-radius: 2px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .activity-info-cards {
    grid-template-columns: 1fr;
  }
  
  .trial-records {
    grid-template-columns: 1fr;
  }
  
  .record-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .record-meta {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    margin-top: 5px;
  }
  
  .avatars-grid {
    grid-template-columns: 1fr;
  }
}
</style>