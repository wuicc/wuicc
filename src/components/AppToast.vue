<template>
  <div class="toast-container">
    <transition-group name="toast" tag="div">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="[`toast-${toast.color}`]"
        :style="{ 'z-index': toast.zIndex }"
      >
        <div class="toast-content">
          {{ toast.message }}
        </div>
        <v-btn
          color="white"
          variant="text"
          size="small"
          @click="closeToast(toast.id)"
        >
          {{ $t("app.common.close") }}
        </v-btn>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const emit = defineEmits(['mounted']);
const toasts = ref([]);
let nextId = 0;
let zIndexCounter = 10; // 初始z-index值

const showToast = (msg, toastColor = "success", duration = 3000) => {
  const id = nextId++;
  const zIndex = zIndexCounter++;
  
  // 添加新Toast（在数组末尾）
  toasts.value.push({
    id,
    message: msg,
    color: toastColor,
    timeout: duration,
    zIndex
  });

  // 自动关闭定时器
  if (duration > 0) {
    setTimeout(() => {
      closeToast(id);
    }, duration);
  }
};

const closeToast = (id) => {
  const index = toasts.value.findIndex(toast => toast.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
};

// 暴露方法供外部调用
defineExpose({
  showToast,
});

// 组件挂载完成后发出事件
onMounted(() => {
  emit('mounted');
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 12px;
  z-index: 1000;
}

.toast-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  padding: 14px 16px;
  border-radius: 4px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  color: white;
  transition: all 0.4s ease;
  margin-top: 12px;
}

.toast-content {
  flex-grow: 1;
  padding-right: 16px;
}

.toast-success {
  background-color: #4CAF50;
}

.toast-error {
  background-color: #F44336;
}

.toast-warning {
  background-color: #FF9800;
}

.toast-info {
  background-color: #2196F3;
}

/* 入场动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(50px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-move {
  transition: transform 0.4s ease;
}
</style>