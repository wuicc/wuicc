<template>
  <!-- 标签锁对话框 -->
  <TabLockDialog
    v-model="showTabLockDialog"
    :lock-status="lockStatus"
    @force-acquire="handleForceAcquire"
    @close="handleCloseDialog"
  />

  <!-- 主应用内容 -->
  <router-view />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from 'vue-i18n';
import TabLockDialog from "@/components/TabLockDialog.vue";
import TabLockManager from "@/utils/TabLockManager";

// 响应式数据
const showTabLockDialog = ref(false);
const lockStatus = ref(null); // 'occupied' | 'lost'
const appToast = ref(null);
const { t } = useI18n();

// 初始化标签锁管理器
const tabLockManager = new TabLockManager();

// 设置回调函数
tabLockManager.onLockOccupiedCallback = () => {
  // console.log('锁被其他标签页占用')
  lockStatus.value = "occupied";
  showTabLockDialog.value = true;
};

tabLockManager.onLockLostCallback = () => {
  // console.log('锁已丢失（被强制转移）')
  lockStatus.value = "lost";
  showTabLockDialog.value = true;
};

/**
 * 检查标签锁状态
 */
const checkTabLock = async () => {
  try {
    const currentLock = await tabLockManager.getLockStatus();

    if (!currentLock.locked) {
      // 尝试获取锁
      const acquired = await tabLockManager.acquireLock();
      if (acquired) {
        // console.log('成功获取锁，正常加载应用')
        return;
      }
    }

    // 锁已被占用但不是当前标签页持有
    if (currentLock.locked && currentLock.tabId !== tabLockManager.tabId) {
      // console.log('锁已被其他标签页占用')
      lockStatus.value = "occupied";
      showTabLockDialog.value = true;
    }
  } catch (error) {
    // console.error('检查标签锁失败:', error)
    // 出错时默认显示占用状态
    lockStatus.value = "occupied";
    showTabLockDialog.value = true;
  }
};

/**
 * 处理强制获取锁
 */
const handleForceAcquire = async () => {
  try {
    await tabLockManager.forceAcquireLock();
    showTabLockDialog.value = false;
    // console.log("强制获取锁成功，继续操作");
  } catch (error) {
    // console.error("强制获取锁失败:", error);
    // 可以添加失败提示
  }
};

/**
 * 关闭对话框处理
 */
const handleCloseDialog = () => {
  showTabLockDialog.value = false;
  // 可以根据业务需求决定是否关闭页面
  // window.close() // 谨慎使用
};

// 组件挂载时检查标签锁
onMounted(() => {
  checkTabLock();
});

// 组件卸载时清理资源
onBeforeUnmount(() => {
  tabLockManager.destroy();
});
</script>