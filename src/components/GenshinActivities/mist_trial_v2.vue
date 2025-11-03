<template>
  <div class="mist-trial-v2-activity">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 活动内容 -->
    <div v-else class="activity-content">
      <!-- 活动基本信息卡片 -->
      <div class="activity-info-card">
        <div class="activity-header">
          <h2>迷城战线·水境篇</h2>
          <p class="activity-subtitle">元素试炼挑战</p>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">完成试炼数</span>
            <span class="stat-value">{{ getTotalTrials() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最快通关时间</span>
            <span class="stat-value">{{ formatTimeToMinSec(getFastestTime()) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最高单次伤害</span>
            <span class="stat-value">{{ getMaxDamage() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最少承受伤害</span>
            <span class="stat-value">{{ getMinDamageTaken() }}</span>
          </div>
        </div>
      </div>

      <!-- 试炼记录 -->
      <div class="trials-section">
        <h3 class="section-title">试炼记录</h3>
        <div class="trials-grid">
          <div v-for="trial in activityData?.data || []" :key="trial.name" class="trial-card">
            <div class="trial-header">
              <h4>{{ trial.name }}</h4>
            </div>

            <!-- 试炼描述 -->
            <div class="trial-desc" v-html="formatDescription(trial.desc)"></div>

            <div class="trial-stats">
              <div class="stat-row">
                <span class="stat-label">最快完成时间</span>
                <span class="stat-value">{{ formatTimeToMinSec(trial.min_finish_time) }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">最强一击</span>
                <div class="damage-avatar-container">
                  <img :src="trial.max_damage_avatar_icon" alt="角色" class="damage-avatar-icon" />
                  <span class="stat-value">{{ trial.max_damage }}</span>
                </div>
              </div>
              <div class="stat-row">
                <span class="stat-label">最低承伤</span>
                <span class="stat-value">{{ trial.min_damage_taken }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">{{ trial.level_record_desc }}</span>
                <span class="stat-value">{{ trial.level_record_val }}</span>
              </div>
            </div>

            <!-- 角色阵容 -->
            <div class="avatars-section">
              <h5>角色阵容</h5>
              <div class="avatars-grid">
                <div v-for="avatar in trial.avatars" :key="avatar.id" class="avatar-card"
                  :class="{ 'trial': avatar.is_trial }">
                  <img :src="avatar.icon" :alt="avatar.id" class="avatar-icon" />
                  <div class="avatar-info">
                    <span class="avatar-level">Lv.{{ avatar.level }}</span>
                    <div class="rarity-stars">
                      <span v-for="star in avatar.rarity" :key="star" class="star">★</span>
                    </div>
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
</template>

<script>
export default {
  name: 'MistTrialV2Activity',
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
    // 获取总试炼数
    getTotalTrials() {
      if (!this.activityData?.data) return 0
      return this.activityData.data.length
    },

    // 获取最快通关时间
    getFastestTime() {
      if (!this.activityData?.data) return 0
      const times = this.activityData.data.map(trial => trial.min_finish_time)
      return Math.min(...times)
    },

    // 将秒数转换为分秒格式
    formatTimeToMinSec(seconds) {
      if (!seconds || seconds === 0) return '0秒'
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      if (minutes === 0) {
        return `${remainingSeconds}秒`
      } else {
        return `${minutes}分${remainingSeconds}秒`
      }
    },

    // 获取最高伤害
    getMaxDamage() {
      if (!this.activityData?.data) return 0
      const damages = this.activityData.data.map(trial => trial.max_damage)
      return Math.max(...damages)
    },

    // 获取最少承受伤害
    getMinDamageTaken() {
      if (!this.activityData?.data) return 0
      const damages = this.activityData.data.map(trial => trial.min_damage_taken)
      return Math.min(...damages)
    },

    // 格式化描述文本，处理颜色标签
    formatDescription(desc) {
      if (!desc) return ''
      return desc.replace(/<color=#([0-9a-fA-F]+)>(.*?)<\/color>/g, '<span style="color: #$1">$2</span>')
    },

    // 移除颜色标签（纯文本版本）
    removeColorTags(text) {
      if (!text) return ''
      return text.replace(/<color=#[0-9a-fA-F]+>(.*?)<\/color>/g, '$1')
    }
  }
}
</script>

<style scoped>
.mist-trial-v2-activity {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.activity-info-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.activity-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.activity-subtitle {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
}

.section-title {
  font-size: 20px;
  margin: 32px 0 16px 0;
  color: #333;
  border-left: 4px solid #1890ff;
  padding-left: 12px;
}

.trials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.trial-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
}

.trial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.trial-header h4 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.max-damage-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.damage-avatar-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
}

.damage-value {
  font-size: 14px;
  font-weight: bold;
  color: #f5222d;
  background: #fff1f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.trial-desc {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
}

.trial-stats {
  margin-bottom: 20px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 6px 0;
}

.stat-row .stat-label {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.stat-row .stat-value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.damage-avatar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatars-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.avatars-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.avatar-card {
  display: flex;
  align-items: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.avatar-card.trial {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 8px;
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

.rarity-stars {
  display: flex;
  gap: 1px;
}

.star {
  font-size: 10px;
  color: #ffd700;
}

.trial-badge {
  font-size: 10px;
  color: #52c41a;
  background: #f6ffed;
  padding: 1px 4px;
  border-radius: 4px;
  border: 1px solid #b7eb8f;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mist-trial-v2-activity {
    padding: 12px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .trials-grid {
    grid-template-columns: 1fr;
  }

  .trial-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .max-damage-avatar {
    align-self: flex-end;
  }

  .avatars-grid {
    grid-template-columns: 1fr;
  }

  .avatar-card {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .trial-card {
    padding: 16px;
  }
}
</style>