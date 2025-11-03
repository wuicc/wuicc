import { defineStore } from 'pinia';
import { ref } from 'vue';

// 定义事件存储
// 这个store只在内存中保存数据，刷新页面或修改游戏配置后会失效
export const useEventsStore = defineStore('events', () => {
  // 存储活动数据
  const activities = ref([]);
  
  // 存储加载状态
  const loading = ref(false);
  
  // 存储错误信息
  const error = ref(null);
  
  // 设置活动数据
  const setActivities = (data) => {
    activities.value = data;
  };
  
  // 获取活动数据
  const getActivities = () => {
    return activities.value;
  };
  
  // 设置加载状态
  const setLoading = (status) => {
    loading.value = status;
  };
  
  // 设置错误信息
  const setError = (err) => {
    error.value = err;
  };
  
  // 清除所有数据（用于刷新页面或修改游戏配置后）
  const clearAll = () => {
    activities.value = [];
    loading.value = false;
    error.value = null;
  };
  
  return {
    activities,
    loading,
    error,
    setActivities,
    getActivities,
    setLoading,
    setError,
    clearAll
  };
});