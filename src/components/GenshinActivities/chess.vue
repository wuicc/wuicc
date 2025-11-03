<template>
  <div class="chess-container">
    <!-- 加载状态 -->
    <v-card v-if="!activityData" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-loading</v-icon>
      <div class="text-h6 text-grey mt-4">加载中...</div>
    </v-card>

    <!-- 活动详情 -->
    <div v-else>
      <!-- 活动基本信息卡片 -->
      <v-card class="mb-4" variant="tonal" color="accent">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-chess-knight</v-icon>
          机关棋谭·灵妙之局
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-accent">{{ activityData.total_times || 0 }}</div>
                <div class="text-caption text-medium-emphasis">总挑战成功次数</div>
              </div>
            </v-col>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-secondary">{{ activityData.level || 0 }}</div>
                <div class="text-caption text-medium-emphasis">弈棋术</div>
              </div>
            </v-col>
            <v-col cols="6" md="4">
              <div class="text-center">
                <div class="text-body-2 font-weight-medium">{{ formatTime(activityData.start_time) }}</div>
                <div class="text-body-2 font-weight-medium">{{ formatTime(activityData.end_time) }}</div>
                <div class="text-caption text-medium-emphasis">统计周期</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 关卡记录区域 -->
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-flag-checkered</v-icon>
          关卡记录
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col v-for="(record, index) in activityData.records" :key="index" cols="12" md="6" lg="4">
              <v-card class="h-100" variant="outlined" hover>
                <!-- 关卡头部信息 -->
                <v-card-title class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ record.name }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-body-2 font-weight-medium text-info">{{ formatTime(record.settle_time) }}</div>
                    <div class="text-caption text-medium-emphasis">通关时间</div>
                  </div>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- 机关配置 -->
                  <div class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">机关配置</div>
                    <v-row dense>
                      <v-col v-for="(gear, gearIndex) in record.gears" :key="gearIndex" cols="6" sm="4">
                        <v-card variant="flat" class="d-flex flex-column align-center justify-center pa-2">
                          <v-img :src="gear.icon" :alt="gear.name" class="rounded elevation-2 mx-auto" 
                                 height="50" width="50" />
                          <div class="text-caption mt-1 text-center">{{ gear.name }}</div>
                          <div class="text-caption text-medium-emphasis">数量: {{ gear.number }}</div>
                          <v-chip v-if="gear.element" size="x-small" :color="getElementColor(gear.element)" variant="tonal">
                        {{ getElementName(gear.element) }}
                      </v-chip>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>

                  <!-- 灵签配置 -->
                  <div>
                    <div class="text-subtitle-2 font-weight-bold mb-2">灵签配置</div>
                    <v-row dense>
                      <v-col v-for="(card, cardIndex) in record.cards" :key="cardIndex" cols="12">
                        <v-card variant="tonal" :color="getCardTypeColor(card.name)" class="pa-2">
                          <div class="d-flex align-center justify-space-between">
                            <div class="d-flex align-center">
                              <v-img :src="card.icon" :alt="card.name" class="rounded mr-2" 
                                     height="30" width="30" style="background-color: #666;"/>
                              <span class="text-body-2">{{ card.name }}</span>
                            </div>
                            <v-chip size="small" :color="getCardTypeColor(card.name)" variant="flat">
                              {{ card.number }}张
                            </v-chip>
                          </div>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Chess',
  props: {
    activityData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // 格式化时间戳
    const formatTime = (timestamp) => {
      if (!timestamp) return '未知'

      try {
        const date = new Date(Number(timestamp) * 1000)
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          return '时间格式错误'
        }

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      } catch (error) {
        console.error('时间格式化错误:', error)
        return '时间未知'
      }
    }

    // 获取元素对应的颜色
    const getElementColor = (element) => {
      const colorMap = {
        'Hydro': 'blue',
        'Pyro': 'red',
        'Cryo': 'cyan',
        'Electro': 'purple',
        'Anemo': 'green',
        'Geo': 'orange',
        'Dendro': 'lime'
      }
      return colorMap[element] || 'grey'
    }

    // 将英文元素名称转换为中文
    const getElementName = (element) => {
      const elementMap = {
        'Pyro': '火',
        'Hydro': '水',
        'Cryo': '冰',
        'Electro': '雷',
        'Anemo': '风',
        'Geo': '岩',
        'Dendro': '草'
      }
      return elementMap[element] || element
    }

    // 获取灵签类型对应的颜色
    const getCardTypeColor = (cardName) => {
      if (cardName.includes('灵签')) return 'accent'
      if (cardName.includes('妙签')) return 'success'
      if (cardName.includes('诡签')) return 'error'
      if (cardName.includes('勇签')) return 'warning'
      return 'info'
    }

    return {
      formatTime,
      getElementColor,
      getElementName,
      getCardTypeColor
    }
  }
}
/*
Pyro: 火
Hydro: 水
Cryo: 冰
Electro: 雷
Anemo: 风
Geo: 岩
Dendro: 草
*/
</script>

<style scoped>
.chess-container {
  padding: 16px;
}

/* 响应式间距调整 */
@media (max-width: 960px) {
  .chess-container {
    padding: 12px;
  }
}

@media (max-width: 600px) {
  .chess-container {
    padding: 8px;
  }
}
</style>