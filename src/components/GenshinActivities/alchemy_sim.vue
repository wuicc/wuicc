<template>
  <div class="alchemy-sim">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="activity-content">
      <!-- 活动基本信息卡片 -->
      <div class="info-card">
        <h3>升炼研巧万策金</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">经营周期</span>
            <span class="stat-value">{{ activityData.stats?.cycle }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">可用资金</span>
            <span class="stat-value">{{ formatMora(activityData.stats?.available_fund) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">累计营收</span>
            <span class="stat-value">{{ formatMora(activityData.stats?.total_revenue) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">炼金等级</span>
            <span class="stat-value">{{ activityData.alchemy?.alchemy_level }}</span>
          </div>
        </div>
      </div>

      <!-- 炼金统计 -->
      <div class="section">
        <h4>炼金统计</h4>
        <div class="alchemy-stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⚗️</div>
            <div class="stat-content">
              <span class="stat-title">炼金等级</span>
              <span class="stat-value">{{ activityData.alchemy?.alchemy_level }} <span class="stat-subtitle">{{
                activityData.alchemy?.level_name }}</span>
              </span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🧪</div>
            <div class="stat-content">
              <span class="stat-title">药剂制作总数</span>
              <span class="stat-value">{{ activityData.alchemy?.total_potions_made }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <span class="stat-title">最高调合率</span>
              <span class="stat-value">{{ activityData.alchemy?.highest_tuning_rate }}%</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🌿</div>
            <div class="stat-content">
              <span class="stat-title">单次最高消耗药材数</span>
              <span class="stat-value">{{ activityData.alchemy?.highest_ingredients }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 药剂统计 -->
      <div class="section">
        <h4>药剂统计</h4>
        <div class="potions-grid">
          <div class="potion-stat">
            <span class="label">最高等级药剂</span>
            <span class="value">{{ activityData.potions?.highest_level_potion }}</span>
          </div>
          <div class="potion-stat">
            <span class="label">首个制作的药剂</span>
            <span class="value">{{ activityData.potions?.first_potion }}</span>
          </div>
          <div class="potion-stat">
            <span class="label">制作最多的药剂</span>
            <span class="value">{{ activityData.potions?.most_concocted_potion }} ({{
              activityData.potions?.most_concocted_potion_times }}次)</span>
          </div>
          <div class="potion-stat">
            <span class="label">开发的药剂种类数</span>
            <span class="value">{{ activityData.potions?.potion_number }}</span>
          </div>
          <div class="potion-stat">
            <span class="label">炼制的特征种类数</span>
            <span class="value">{{ activityData.potions?.characteristics_number }}</span>
          </div>
        </div>
      </div>

      <!-- 原料统计 -->
      <div class="section">
        <h4>药材统计</h4>
        <div class="ingredients-grid">
          <div class="ingredient-stat">
            <span class="label">药材消耗总数</span>
            <span class="value">{{ activityData.ingredients?.total_consumed }}</span>
          </div>
          <div class="ingredient-stat">
            <span class="label">消耗最多的药材</span>
            <span class="value">{{ activityData.ingredients?.most_consume_ingredient }} ({{
              activityData.ingredients?.most_consume_num }}个)</span>
          </div>
          <div class="ingredient-stat">
            <span class="label">额外药材数量</span>
            <span class="value">{{ activityData.ingredients?.extra_num }}</span>
          </div>
          <div class="ingredient-stat">
            <span class="label">解锁药材种类</span>
            <span class="value">{{ activityData.ingredients?.unlock_num }}</span>
          </div>
          <div class="ingredient-stat">
            <span class="label">最高等级药材</span>
            <span class="value">{{ activityData.ingredients?.max_level_num }}</span>
          </div>
        </div>
      </div>

      <!-- 销售统计 -->
      <div class="section">
        <h4>销售统计</h4>
        <div class="sales-grid">
          <div class="sale-stat">
            <span class="label">销量最高的药剂</span>
            <span class="value">{{ activityData.sales?.highest_sale_potion }} ({{
              activityData.sales?.highest_sale_potion_num }}瓶)</span>
          </div>
          <div class="sale-stat">
            <span class="label">营收最高的药剂</span>
            <span class="value">{{ activityData.sales?.highest_revenue_potion }} ({{
              formatMora(activityData.sales?.highest_revenue_potion_mora) }})</span>
          </div>
          <div class="sale-stat">
            <span class="label">最高销量周期</span>
            <span class="value">第{{ activityData.sales?.highest_sale_volume_cycle }}期 ({{
              activityData.sales?.highest_sale_volume }}瓶)</span>
          </div>
          <div class="sale-stat">
            <span class="label">最高营收周期</span>
            <span class="value">第{{ activityData.sales?.highest_revenue_cycle }}期 ({{
              formatMora(activityData.sales?.highest_revenue) }})</span>
          </div>
          <div v-if="activityData.sales?.is_show_dealer" class="sale-stat">
            <span class="label">最佳经销商</span>
            <span class="value">{{ activityData.sales?.dealer }} ({{
              formatMora(activityData.sales?.dealer_highest_revenue) }})</span>
          </div>
        </div>
      </div>

      <!-- 信件列表 -->
      <div class="section">
        <h4>商业来信</h4>
        <div class="letters-grid">
          <div v-for="letter in activityData.letters" :key="letter.id" class="letter-card">
            <div class="letter-header">
              <img :src="letter.icon" :alt="letter.name" class="letter-icon" />
              <span class="letter-name">{{ letter.name }}</span>
            </div>
            <div class="letter-content">
              {{ formatLetterContent(letter.content) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AlchemySim',
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
    // 格式化摩拉金额
    formatMora(amount) {
      return amount;
      // if (!amount) return '0 摩拉'
      // if (amount >= 1000000) {
      //   return (amount / 1000000).toFixed(1) + 'M 摩拉'
      // } else if (amount >= 1000) {
      //   return (amount / 1000).toFixed(1) + 'K 摩拉'
      // }
      // return amount.toLocaleString() + ' 摩拉'
    },
    // 格式化信件内容（处理换行符）
    formatLetterContent(content) {
      if (!content) return ''
      return content.replace(/\\n/g, '\n')
    }
  }
}
</script>

<style scoped>
.alchemy-sim {
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
  margin-bottom: 16px;
}

.section h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 8px;
}

.alchemy-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  font-size: 32px;
  margin-right: 16px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
}

.stat-subtitle {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.potions-grid,
.ingredients-grid,
.sales-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.potion-stat,
.ingredient-stat,
.sale-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.potion-stat .label,
.ingredient-stat .label,
.sale-stat .label {
  font-weight: 500;
  color: #555;
}

.potion-stat .value,
.ingredient-stat .value,
.sale-stat .value {
  font-weight: 600;
  color: #333;
}

.letters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.letter-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.letter-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}

.letter-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 12px;
}

.letter-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.letter-content {
  white-space: pre-line;
  line-height: 1.6;
  color: #555;
  font-size: 14px;
}

@media (max-width: 768px) {
  .alchemy-sim {
    padding: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .alchemy-stats-grid {
    grid-template-columns: 1fr;
  }

  .potions-grid,
  .ingredients-grid,
  .sales-grid {
    grid-template-columns: 1fr;
  }

  .letters-grid {
    grid-template-columns: 1fr;
  }

  .potion-stat,
  .ingredient-stat,
  .sale-stat {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>