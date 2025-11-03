<template>
  <div class="crystal-v2-activity">
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
          <v-icon left>mdi-crystal-ball</v-icon>
          振晶的复核实验
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col sm="6">
              <div class="stat-item">
                <div class="stat-label">完成试炼数</div>
                <div class="stat-value">{{ getTotalTrials() }}</div>
              </div>
            </v-col>
            <v-col sm="6">
              <div class="stat-item">
                <div class="stat-label">最高分数</div>
                <div class="stat-value">{{ getMaxScore() }}</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 试炼记录 -->
      <v-card v-for="(record, index) in activityData.records" :key="index" class="trial-record mb-4">
        <v-card-title class="d-flex align-center">
          <v-img :src="record.heraldry_icon" width="40" height="40" class="mr-2" max-width="40"></v-img>
          <span class="trial-name">{{ record.stage_name }}</span>
          <v-spacer></v-spacer>
          <div>
            <v-chip small class="ml-2" :color="getDifficultyColor(record.difficulty)" variant="tonal">
              {{ getDifficultyText(record.difficulty) }}
            </v-chip>
            <v-chip small class="ml-2" color="info" variant="tonal">
              倍率: {{ record.factor }}x
            </v-chip>
            <v-chip small class="ml-2" color="accent">
              最高分数 {{ record.stage_score }}
            </v-chip>
          </div>
        </v-card-title>

        <v-card-text>
          <!-- 上半场 -->
          <div class="half-section">
            <h4 class="section-title">上半场</h4>
            <div class="avatar-grid">
              <div v-for="avatar in record.first_half.avatars" :key="avatar.id" class="avatar-item">
                <v-img :src="avatar.icon" width="60" height="60" class="avatar-icon"></v-img>
                <div class="avatar-info">
                  <div class="avatar-level">Lv.{{ avatar.level }}</div>
                  <v-chip x-small :color="getRarityColor(avatar.rarity)">
                    {{ avatar.rarity }}★
                  </v-chip>
                  <v-chip v-if="avatar.is_trial" x-small color="secondary" class="ml-1">
                    试用
                  </v-chip>
                </div>
              </div>
            </div>

            <!-- 上半场buff -->
            <div class="buff-section">
              <h5>振晶配置</h5>
              <div class="buff-grid">
                <div v-for="buff in record.first_half.buffs" :key="buff.cond_id" class="buff-item">
                  <v-img :src="buff.effect_icon" width="30" height="30" class="buff-icon"></v-img>
                  <div class="buff-info">
                    <div class="buff-level">Lv.{{ buff.effect_level }}</div>
                    <div class="buff-effect" v-html="formatEffect(buff.effect)"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 下半场 -->
          <div class="half-section mt-4">
            <h4 class="section-title">下半场</h4>
            <div class="avatar-grid">
              <div v-for="avatar in record.second_half.avatars" :key="avatar.id" class="avatar-item">
                <v-img :src="avatar.icon" width="60" height="60" class="avatar-icon"></v-img>
                <div class="avatar-info">
                  <div class="avatar-level">Lv.{{ avatar.level }}</div>
                  <v-chip x-small :color="getRarityColor(avatar.rarity)">
                    {{ avatar.rarity }}★
                  </v-chip>
                  <v-chip v-if="avatar.is_trial" x-small color="secondary" class="ml-1">
                    试用
                  </v-chip>
                </div>
              </div>
            </div>

            <!-- 下半场buff -->
            <div class="buff-section">
              <h5>振晶配置</h5>
              <div class="buff-grid">
                <div v-for="buff in record.second_half.buffs" :key="buff.cond_id" class="buff-item">
                  <v-img :src="buff.effect_icon" width="30" height="30" class="buff-icon"></v-img>
                  <div class="buff-info">
                    <div class="buff-level">Lv.{{ buff.effect_level }}</div>
                    <div class="buff-effect" v-html="formatEffect(buff.effect)"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CrystalV2Activity',
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
    // 获取总试炼数
    getTotalTrials() {
      return this.activityData.records ? this.activityData.records.length : 0;
    },

    // 获取最高分数
    getMaxScore() {
      if (!this.activityData.records || this.activityData.records.length === 0) return 0;
      return Math.max(...this.activityData.records.map(record => record.stage_score));
    },

    // 获取平均分数
    getAverageScore() {
      if (!this.activityData.records || this.activityData.records.length === 0) return 0;
      const total = this.activityData.records.reduce((sum, record) => sum + record.stage_score, 0);
      return Math.round(total / this.activityData.records.length);
    },

    // 获取最高难度
    getMaxDifficulty() {
      if (!this.activityData.records || this.activityData.records.length === 0) return 0;
      return Math.max(...this.activityData.records.map(record => record.difficulty));
    },

    // 获取难度文本
    getDifficultyText(difficulty) {
      const difficultyMap = {
        0: '简单',
        1: '普通',
        2: '困难',
        3: '极难'
      };
      return difficultyMap[difficulty] || `难度${difficulty}`;
    },

    // 获取难度颜色
    getDifficultyColor(difficulty) {
      const colors = {
        0: 'green',
        1: 'blue',
        2: 'orange',
        3: 'red'
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
    },

    // 格式化效果文本
    formatEffect(effect) {
      return effect.replace(/\\n/g, '<br>').replace(/<c1>(.*?)<\/c1>/g, '<span class="color-1">$1</span>')
        .replace(/<c2>(.*?)<\/c2>/g, '<span class="color-2">$1</span>')
        .replace(/<c3>(.*?)<\/c3>/g, '<span class="color-3">$1</span>');
    }
  }
}
</script>

<style scoped>
.crystal-v2-activity {
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

.trial-record {
  border-left: 4px solid #2196f3;
}

.trial-name {
  font-size: 18px;
  font-weight: bold;
}

.half-section {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.section-title {
  margin-bottom: 16px;
  color: #333;
  font-size: 16px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
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
  align-items: center;
  justify-content: center;
  text-align: center;
}

.avatar-level {
  font-size: 12px;
  color: #666;
}

.buff-section {
  margin-top: 16px;
}

.buff-section h5 {
  margin-bottom: 12px;
  color: #555;
  font-size: 14px;
}

.buff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.buff-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.buff-icon {
  border-radius: 4px;
}

.buff-level {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.buff-effect {
  font-size: 12px;
  line-height: 1.4;
  color: #333;
}

.color-1 {
  color: #4caf50;
  font-weight: bold;
}

.color-2 {
  color: #2196f3;
  font-weight: bold;
}

.color-3 {
  color: #f44336;
  font-weight: bold;
}

@media (max-width: 768px) {
  .crystal-v2-activity {
    padding: 10px;
  }

  .avatar-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .buff-grid {
    grid-template-columns: 1fr;
  }
}
</style>