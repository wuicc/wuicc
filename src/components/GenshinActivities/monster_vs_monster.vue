<template>
  <div class="monster-vs-monster">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!activityData.exists_data" class="no-data">暂无数据</div>
    <div v-else class="activity-content">
      <!-- 活动基本信息卡片 -->
      <div class="activity-stats">
        <div class="stat-card">
          <h3>进攻想定</h3>
          <p class="stat-value">{{ attackDungeonsCount }}</p>
          <p class="stat-label">总关卡数</p>
        </div>
        <div class="stat-card">
          <h3>防御想定</h3>
          <p class="stat-value">{{ defenceDungeonsCount }}</p>
          <p class="stat-label">总关卡数</p>
        </div>
      </div>

      <!-- 进攻想定详情 -->
      <div class="section">
        <h2>进攻想定</h2>
        <div class="attack-dungeons">
          <div v-for="dungeon in activityData.attack_dungeons" :key="dungeon.name" class="dungeon-card">
            <div class="dungeon-header">
              <h3>{{ dungeon.name }}</h3>
              <span class="time">最佳记录剩余: {{ formatTime(dungeon.left_time) }}</span>
            </div>
            <div class="skill-info">
              <img :src="dungeon.skill.icon" :alt="dungeon.skill.name" class="skill-icon" style="background-color: #666;">
              <div class="skill-details">
                <h4>{{ dungeon.skill.name }}</h4>
                <p>{{ dungeon.skill.desc }}</p>
              </div>
            </div>
            <div class="lineup">
              <h4>阵容配置</h4>
              <div class="monsters">
                <div v-for="(monster, index) in dungeon.lineup" :key="index" class="monster">
                  <div class="monster-wrapper" :style="{ borderColor: getElementStyle(monster.element) }">
                    <img :src="monster.icon" :alt="`怪物${index + 1}`" class="monster-icon">
                    <div class="element-indicator" :style="{ backgroundColor: getElementStyle(monster.element) }" :title="elementMap[monster.element]?.name"></div>
                  </div>
                  <img :src="monster.tag_icon" :alt="`标签${index + 1}`" class="tag-icon">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 防御想定详情 -->
      <div class="section">
        <h2>防御想定</h2>
        <div class="defence-dungeons">
          <div v-for="dungeon in activityData.defence_dungeons" :key="dungeon.name" class="defence-card">
            <h3>{{ dungeon.name }}</h3>
            <div class="completeness-bar">
              <div class="completeness-fill" :style="{ width: dungeon.completeness + '%' }"></div>
              <span class="completeness-text">{{ dungeon.completeness }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MonsterVsMonster',
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
    // 进攻想定数量
    attackDungeonsCount() {
      return this.activityData.attack_dungeons?.length || 0
    },
    // 防御想定数量
    defenceDungeonsCount() {
      return this.activityData.defence_dungeons?.length || 0
    },
    // 平均完成度
    averageCompleteness() {
      if (!this.activityData.defence_dungeons?.length) return 0
      const total = this.activityData.defence_dungeons.reduce((sum, dungeon) => sum + dungeon.completeness, 0)
      return Math.round(total / this.activityData.defence_dungeons.length)
    },
    // 平均用时
    averageTime() {
      if (!this.activityData.attack_dungeons?.length) return 0
      const total = this.activityData.attack_dungeons.reduce((sum, dungeon) => sum + dungeon.left_time, 0)
      return Math.round(total / this.activityData.attack_dungeons.length)
    },
    // 元素映射
    elementMap() {
      return {
        0: { name: '无', color: '#999999' },
        1: { name: '火', color: '#e74c3c' },
        2: { name: '水', color: '#3498db' },
        3: { name: '草', color: '#2ecc71' },
        4: { name: '雷', color: '#9b59b6' },
        5: { name: '冰', color: '#00cec9' },
        6: { name: '岩', color: '#f39c12' },
        7: { name: '风', color: '#1abc9c' }
      }
    }
  },
  methods: {
    // 格式化时间（秒转分:秒）
    formatTime(seconds) {
      if (!seconds) return '0:00'
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}分${remainingSeconds.toString().padStart(2, '0')}秒`
    },
    // 获取元素样式
    getElementStyle(element) {
      const elementInfo = this.elementMap[element] || this.elementMap[0]
      return elementInfo.color
    },
  }
}
/*
0:（无）
1:火
2:水
3:草
4:雷
5:冰
6:岩
7:风
*/
</script>

<style scoped>
.monster-vs-monster {
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

.attack-dungeons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.dungeon-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dungeon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.dungeon-header h3 {
  margin: 0;
  color: #495057;
}

.time {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.skill-info {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.skill-icon {
  width: 40px;
  height: 40px;
  margin-right: 15px;
  border-radius: 4px;
}

.skill-details h4 {
  margin: 0 0 5px 0;
  color: #495057;
}

.skill-details p {
  margin: 0;
  font-size: 12px;
  color: #6c757d;
  line-height: 1.4;
}

.lineup h4 {
  margin: 0 0 10px 0;
  color: #495057;
}

.monsters {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.monster {
  position: relative;
  text-align: center;
}

.monster-wrapper {
  position: relative;
  display: inline-block;
  padding: 2px;
  border-radius: 8px;
  border: 2px solid #999999;
}

.monster-icon {
  width: 50px;
  height: 50px;
  border-radius: 6px;
}

.element-indicator {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
}

.tag-icon {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e9ecef;
}

.defence-dungeons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.defence-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.defence-card h3 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #495057;
}

.completeness-bar {
  position: relative;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.completeness-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.completeness-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: bold;
  color: #495057;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .monster-vs-monster {
    padding: 10px;
  }
  
  .activity-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .attack-dungeons {
    grid-template-columns: 1fr;
  }
  
  .defence-dungeons {
    grid-template-columns: 1fr;
  }
  
  .monsters {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>