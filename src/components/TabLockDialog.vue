<template>
  <v-dialog
    v-model="dialog"
    max-width="500"
    persistent
    no-click-animation
    :hide-overlay="true"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon :color="iconColor" class="mr-2">{{ icon }}</v-icon>
        {{ title }}
      </v-card-title>
      
      <v-card-text class="pt-4 pb-0">
        <div class="text-body-1 mb-2">
          {{ message }}
        </div>
        
        <div v-if="showWarning" class="text-caption text-medium-emphasis">
          {{ warning }}
        </div>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        
        <!-- 主操作按钮 -->
        <v-btn
          color="accent"
          variant="elevated"
          @click="handleForceAcquire"
        >
          {{ actionText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: Boolean,       // 控制对话框显示
  lockStatus: String        // 'occupied' | 'lost'
})

const emit = defineEmits([
  'update:modelValue',
  'force-acquire'
])

// 计算属性
const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const icon = computed(() => {
  return props.lockStatus === 'lost' ? 'mdi-alert-circle' : 'mdi-alert'
})

const iconColor = computed(() => {
  return props.lockStatus === 'lost' ? 'error' : 'warning'
})

const title = computed(() => {
  return props.lockStatus === 'lost' 
    ? t('app.tabLock.lostLockTitle')
    : t('app.tabLock.title')
})

const message = computed(() => {
  return props.lockStatus === 'lost'
    ? t('app.tabLock.lostLockMessage')
    : t('app.tabLock.message')
})

const warning = computed(() => {
  return props.lockStatus === 'lost'
    ? ''
    : t('app.tabLock.warning')
})

const showWarning = computed(() => {
  return props.lockStatus === 'occupied'
})

const actionText = computed(() => {
  return props.lockStatus === 'lost'
    ? t('app.tabLock.forceAcquire')
    : t('app.tabLock.continue')
})

// 事件处理
const handleForceAcquire = () => {
  emit('force-acquire')
}
</script>

<style scoped>
.v-card-title {
  padding-bottom: 0;
}
</style>