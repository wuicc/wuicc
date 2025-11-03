<template>
  <div>
    <div v-if="loading" class="loading">正在加载文件内容...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <pre v-else>{{ fileContent }}</pre>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const fileContent = ref('')
const loading = ref(true)
const error = ref('')

// 允许访问的文件白名单
const allowedFiles = [
  'wuicc-gacha-import.ps1',
  'wuicc-genshin-act-import.ps1'
]

onMounted(async () => {
  const fileName = route.params.filename

  if (!fileName) {
    error.value = '文件名参数缺失'
    loading.value = false
    return
  }

  // 检查文件是否在白名单中
  if (!allowedFiles.includes(fileName)) {
    error.value = `文件 ${fileName} 不允许访问。`
    loading.value = false
    return
  }

  try {
    // 通过HTTP请求获取文件内容
    const response = await fetch(`/import-scripts/${fileName}`)
    if (response.ok) {
      fileContent.value = await response.text()
    } else {
      error.value = `文件 ${fileName} 不存在 (${response.status})`
    }
  } catch (err) {
    console.error('文件读取失败:', err)
    error.value = `文件 ${fileName} 读取失败`
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.loading {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #666;
}

.error {
  background: #ffebee;
  color: #c62828;
  padding: 20px;
  border-radius: 4px;
  margin: 20px;
  border-left: 4px solid #f44336;
}

pre {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.4;
  margin: 20px;
}
</style>