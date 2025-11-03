<template>
  <div class="martial-legend-v2-activity">
    <div v-if="loading" class="loading">
      <v-progress-circular indeterminate color="accent"></v-progress-circular>
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
          <v-icon left>mdi-sword-cross</v-icon>
          离垢者肃心旅宴
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
                <div class="stat-label">最高分数</div>
                <div class="stat-value">{{ getMaxScore() }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="stat-item">
                <div class="stat-label">最快用时</div>
                <div class="stat-value">{{ getBestTime() }}</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 挑战记录 -->
      <v-card v-for="(record, index) in activityData.records" :key="index" class="challenge-record mb-4">
        <v-card-title class="d-flex align-center">
          <v-img v-if="record.challenges.list[0]?.boss_icon" :src="record.challenges.list[0].boss_icon" width="40"
            height="40" class="mr-2" max-width="40px"></v-img>
          <span class="challenge-name">{{ record.challenge_name }}</span>
          <v-spacer></v-spacer>
          <v-chip v-if="record.difficulty > 0" small class="ml-2" :color="getDifficultyColor(record.difficulty)">
            {{ getDifficultyText(record.difficulty) }}
          </v-chip>
          <v-chip v-if="record.score_multiple" small class="ml-2" color="accent">
            倍率 {{ record.score_multiple }}x
          </v-chip>
          <v-chip v-if="record.max_score > 0" small class="ml-2" color="accent">
            最高分数 {{ record.max_score }}
          </v-chip>
          <v-chip v-if="record.best_used_time > 0" small class="ml-2" color="success">
            最佳用时 {{ formatTime(record.best_used_time) }}
          </v-chip>
          <v-chip v-if="record.is_multiplayer_online" small class="ml-2" color="secondary">
            联机
          </v-chip>
        </v-card-title>

        <v-card-text>

          <!-- 挑战信息 -->
          <div v-if="record.max_score > 0" class="challenge-info">

            <!-- 角色阵容 -->
            <div v-for="(challenge, challengeIndex) in record.challenges.list" :key="challengeIndex"
              class="challenge-section">
              <h4 class="section-title">
                {{ challenge.boss_name || `第${challengeIndex + 1}阶段` }}
              </h4>
              <div v-if="challenge.avatars.length > 0" class="avatar-grid">
                <div v-for="avatar in challenge.avatars" :key="avatar.id" class="avatar-item">
                  <v-img :src="avatar.icon" width="60" height="60" class="avatar-icon"></v-img>
                  <div class="avatar-info">
                    <div class="avatar-level">Lv.{{ avatar.level }}</div>
                    <v-chip x-small :color="getRarityColor(avatar.rarity)">
                      {{ avatar.rarity }}★
                    </v-chip>
                    <v-chip v-if="avatar.is_multiplayer_online" x-small color="secondary" class="ml-1">
                      联机
                    </v-chip>
                  </div>
                </div>
              </div>
              <div v-else class="no-avatars">
                <v-icon>mdi-account-question</v-icon>
                <span>暂无角色记录</span>
              </div>
            </div>
            <!-- 限制条件 -->
            <div v-if="record.limit_conditions.length > 0" class="conditions-section">
              <h4 class="section-title">挑战详情</h4>
              <div class="conditions-grid">
                <div v-for="condition in record.limit_conditions" :key="condition.id" class="condition-item">
                  <span class="condition-desc">{{ condition.desc }}</span><v-spacer></v-spacer>
                  <v-chip x-small color="red" class="mr-1">
                    +{{ condition.score }}
                  </v-chip>
                </div>
              </div>
            </div>

            <!-- Boss增益 -->
            <div v-if="record.boss_buffs.length > 0" class="buffs-section">
              <h4 class="section-title">额外增幅</h4>
              <div class="buffs-grid">
                <div v-for="buff in record.boss_buffs" :key="buff.id" class="buff-item">
                  <span class="buff-desc">{{ buff.desc }}</span><v-spacer></v-spacer>
                  <v-chip x-small color="orange" class="mr-1">
                    +{{ buff.score }}
                  </v-chip>
                </div>
              </div>
            </div>

            <!-- 自身增益 -->
            <div v-if="record.myself_buffs.length > 0" class="buffs-section">
              <h4 class="section-title">「气律」</h4>
              <div class="buffs-grid">
                <div v-for="buff in record.myself_buffs" :key="buff.id" class="buff-item">
                  <span class="buff-desc">{{ buff.desc }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- 未完成挑战 -->
          <div v-else class="not-completed">
            <v-icon>mdi-lock</v-icon>
            <span>挑战未完成</span>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MartialLegendV2Activity',
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
      return this.activityData.records ? this.activityData.records.length : 0;
    },

    // 获取已完成挑战数
    getCompletedChallenges() {
      if (!this.activityData.records) return 0;
      return this.activityData.records.filter(record => record.max_score > 0).length;
    },

    // 获取最高分数
    getMaxScore() {
      if (!this.activityData.records || this.activityData.records.length === 0) return 0;
      const scores = this.activityData.records.map(record => record.max_score);
      return Math.max(...scores);
    },

    // 获取最佳用时
    getBestTime() {
      if (!this.activityData.records || this.activityData.records.length === 0) return '--';
      const times = this.activityData.records
        .filter(record => record.best_used_time > 0)
        .map(record => record.best_used_time);
      if (times.length === 0) return '--';
      return this.formatTime(Math.min(...times));
    },

    // 格式化时间（秒转分:秒）
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    // 获取难度文本
    getDifficultyText(difficulty) {
      const difficultyMap = {
        0: '简单',
        1: '普通',
        2: '困难',
        3: '极难',
        4: '无畏'
      };
      return difficultyMap[difficulty] || `难度${difficulty}`;
    },

    // 获取难度颜色
    getDifficultyColor(difficulty) {
      const colors = {
        1: 'green',
        2: 'blue',
        3: 'orange',
        4: 'red'
      };
      return colors[difficulty] || 'grey';
    },

    // 获取稀有度颜色
    getRarityColor(rarity) {
      const colors = {
        4: 'purple',
        5: 'orange'
      };
      return colors[rarity] || 'grey';
    }
  }
}
</script>

<style scoped>
.martial-legend-v2-activity {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.challenge-record {
  border-left: 4px solid #2196f3;
}

.challenge-name {
  font-size: 18px;
  font-weight: bold;
}

/* .challenge-info {
} */

.section-title {
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 8px;
}

.conditions-grid,
.buffs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.condition-item,
.buff-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.condition-desc,
.buff-desc {
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}

.challenge-section {
  margin: 16px 0;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.avatar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-icon {
  border-radius: 8px;
}

.avatar-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.avatar-level {
  font-size: 12px;
  color: #666;
}

.no-avatars,
.not-completed {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #9e9e9e;
  font-style: italic;
}

@media (max-width: 768px) {
  .martial-legend-v2-activity {
    padding: 10px;
  }

  .conditions-grid,
  .buffs-grid {
    grid-template-columns: 1fr;
  }

  .avatar-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>