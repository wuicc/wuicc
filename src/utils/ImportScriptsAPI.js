// API工具函数用于获取import-scripts文件内容
export async function getImportScriptContent(filename) {
  try {
    // 动态导入对应的文件
    const module = await import(`../../public/import-scripts/${filename}?raw`)
    return {
      success: true,
      content: module.default,
      filename: filename
    }
  } catch (error) {
    console.error('文件读取失败:', error)
    return {
      success: false,
      error: `文件 ${filename} 不存在或读取失败`,
      filename: filename
    }
  }
}

// 获取所有可用的import-scripts文件列表
export function getAvailableScripts() {
  return [
    'wuicc-gacha-import',
    'wuicc-genshin-act-import'
  ]
}