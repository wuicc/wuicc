import { defineStore } from 'pinia'

export const useActivityStatusStore = defineStore('activityStatus', {
  state: () => ({
    // 内存中的临时活动状态（仅在应用运行期间存在，页面刷新后失效）
    tempActivityStatuses: {}
  }),
  
  getters: {
    // 获取所有临时活动状态
    allStatuses: (state) => {
      return { ...state.tempActivityStatuses }
    }
  },
  
  actions: {
    // 设置活动状态
    setActivityStatus(uuid, status, isTemp = false) {
      // 无论是否临时，都只存储在内存中
      this.tempActivityStatuses[uuid] = status
      console.log('Pinia Store - 设置活动状态:', { uuid, status, currentTempStatuses: { ...this.tempActivityStatuses } })
    },
    
    // 清除所有临时状态
    clearTempActivityStatuses() {
      console.log('Pinia Store - 清除所有临时状态:', { beforeClear: { ...this.tempActivityStatuses } })
      this.tempActivityStatuses = {}
      console.log('Pinia Store - 清除后临时状态:', { afterClear: { ...this.tempActivityStatuses } })
    },
    
    // 获取单个活动状态
    getActivityStatus(uuid) {
      const status = this.tempActivityStatuses[uuid] || ''
      console.log('Pinia Store - 获取活动状态:', { uuid, status })
      return status
    }
  }
})