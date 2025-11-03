<template>
  <div class="fairy-tales">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!activityData.exists_data" class="no-data">暂无数据</div>
    <div v-else class="activity-content">
      <!-- 活动基本信息卡片 -->
      <div class="activity-stats">
        <div class="stat-card">
          <h3>解锁传送点</h3>
          <p class="stat-value">{{ activityData.stats.way_point_number }}/{{ activityData.stats.max_way_point_number }}
          </p>
        </div>
        <div class="stat-card">
          <h3>获得宝箱数</h3>
          <p class="stat-value">{{ activityData.stats.chest_number }}</p>
        </div>

      </div>

      <!-- 当前挑战详情 -->
      <div v-if="activityData.is_current_open" class="section">
        <h2>北风闪尘吹流</h2>
        <div class="current-challenges">
          <div v-for="challenge in activityData.current" :key="challenge.id" class="challenge-card">
            <div class="challenge-header">
              <h3>{{ challenge.name }}</h3>
              <div class="medal-badge">
                <span class="medal-icon">🏅</span>
                <span class="medal-level">{{ challenge.medal }}星</span>
              </div>
            </div>
            <div class="challenge-score">
              <span class="score-label">最佳分数</span>
              <span class="score-value">{{ challenge.score }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 飞行帽子挑战 -->
      <div v-if="activityData.is_flyppy_hat_open" class="section">
        <h2>飞帽匠戏法</h2>
        <div class="flyppy-hat-challenges">
          <div v-for="challenge in activityData.flyppy_hat" :key="challenge.id" class="flyppy-card">
            <div class="flyppy-header">
              <h3>{{ challenge.name }}</h3>
              <div class="extra-goals">
                <span class="goals-label">连击 / 吸引小人数</span>
                <span class="goals-value">{{ challenge.extra_goal_num }}</span>
              </div>
            </div>
            <div class="flyppy-score">
              <span class="score-label">最佳分数</span>
              <span class="score-value">{{ challenge.score }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 战斗试炼 -->
      <div v-if="activityData.is_combat_open" class="section">
        <h2>星轨王城的试炼</h2>
        <div class="combat-challenges">
          <div v-for="challenge in activityData.combat" :key="challenge.id" class="combat-card">
            <div class="combat-header">
              <h3>{{ challenge.name }}</h3>
              <div class="combat-info">
                <div class="medal-badge">
                  <span class="medal-icon">🏅</span>
                  <span class="medal-level">{{ challenge.medal }}星</span>
                </div>
                <div class="score-multiple">
                  <span class="multiple-label">积分倍率</span>
                  <span class="multiple-value">x{{ challenge.score_multiple }}</span>
                </div>
              </div>
            </div>
            <div class="combat-score">
              <span class="score-label">分数</span>
              <span class="score-value">{{ challenge.score }}</span>
            </div>
            <div class="avatars-section">
              <div class="avatars-group">
                <h4>上半层阵容</h4>
                <div class="avatars-list">
                  <div v-for="avatar in challenge.top_half_floor_avatars" :key="avatar.id" class="avatar-item">
                    <img :src="avatar.icon" :alt="`角色${avatar.id}`" class="avatar-icon">
                    <div class="avatar-info">
                      <span class="avatar-level">Lv.{{ avatar.level }}</span>
                      <span class="avatar-rarity">{{ avatar.rarity }}★</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="avatars-group">
                <h4>下半层阵容</h4>
                <div class="avatars-list">
                  <div v-for="avatar in challenge.bottom_half_floor_avatars" :key="avatar.id" class="avatar-item">
                    <img :src="avatar.icon" :alt="`角色${avatar.id}`" class="avatar-icon">
                    <div class="avatar-info">
                      <span class="avatar-level">Lv.{{ avatar.level }}</span>
                      <span class="avatar-rarity">{{ avatar.rarity }}★</span>
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
  name: 'FairyTales',
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
    // 当前挑战数量
    currentChallengesCount() {
      return this.activityData.current?.length || 0
    },
    // 飞行帽子挑战数量
    flyppyHatChallengesCount() {
      return this.activityData.flyppy_hat?.length || 0
    }
  }
}
</script>

<style scoped>
.fairy-tales {
  padding: 20px;
}

.loading,
.no-data {
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

.current-challenges,
.flyppy-hat-challenges {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.challenge-card,
.flyppy-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.challenge-header,
.flyppy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.challenge-header h3,
.flyppy-header h3 {
  margin: 0;
  color: #495057;
  font-size: 16px;
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

.extra-goals {
  display: flex;
  align-items: center;
  background: #d1ecf1;
  color: #0c5460;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.goals-label {
  margin-right: 4px;
}

.goals-value {
  font-weight: bold;
}

.challenge-score,
.flyppy-score {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.combat-challenges {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.combat-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.combat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.combat-header h3 {
  margin: 0;
  color: #495057;
  font-size: 16px;
  flex: 1;
}

.combat-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.score-multiple {
  display: flex;
  align-items: center;
  background: #e2e3e5;
  color: #383d41;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.multiple-label {
  margin-right: 4px;
}

.multiple-value {
  font-weight: bold;
}

.combat-score {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.avatars-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.avatars-group h4 {
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

.avatar-level {
  font-weight: bold;
}

.avatar-rarity {
  color: orange;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .fairy-tales {
    padding: 10px;
  }

  .activity-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .current-challenges,
  .flyppy-hat-challenges {
    grid-template-columns: 1fr;
  }

  .combat-challenges {
    grid-template-columns: 1fr;
  }

  .avatars-section {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .avatars-list {
    grid-template-columns: repeat(4, 1fr);
  }

  .combat-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .combat-info {
    flex-direction: row;
    margin-top: 10px;
    align-self: flex-start;
  }
}
</style>