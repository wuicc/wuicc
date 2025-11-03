// src/utils/apiEndpoints.js
export const API_ENDPOINTS = {
  // 认证相关
  LOGIN: { url: "/api/auth/login", addTimestamp: false },
  LOGOUT: { url: "/api/auth/logout", addTimestamp: false },
  LOGOUT_ALL: { url: "/api/auth/logout_all", addTimestamp: false },
  REGISTER: { url: "/api/auth/register", addTimestamp: false },
  VERIFY_EMAIL: { url: "/api/auth/verify_email", addTimestamp: true },
  RESEND_VERIFICATION: {
    url: "/api/auth/resend_verification",
    addTimestamp: true,
  },
  QQ_LOGIN: { url: "/api/auth/qq/login", addTimestamp: true },
  QQ_CALLBACK: { url: "/api/auth/qq/callback", addTimestamp: true },
  MICROSOFT_LOGIN: { url: "/api/auth/microsoft/login", addTimestamp: true },
  MICROSOFT_CALLBACK: {
    url: "/api/auth/microsoft/callback",
    addTimestamp: true,
  },

  // 用户相关
  USER_PROFILE: { url: "/api/user/profile", addTimestamp: true },
  UPLOAD_SETTINGS: { url: "/api/user/upload_settings", addTimestamp: false },
  DOWNLOAD_SETTINGS: { url: "/api/user/download_settings", addTimestamp: true },
  CLEAR_CLOUD_SETTINGS: {
    url: "/api/user/clear_cloud_settings",
    addTimestamp: false,
  },

  // 密码管理
  CHANGE_PASSWORD: { url: "/api/auth/change_password", addTimestamp: false },
  REQUEST_PASSWORD_RESET: { 
    url: "/api/auth/request_password_reset", 
    addTimestamp: false 
  },
  RESET_PASSWORD: { url: "/api/auth/reset_password", addTimestamp: false },
  VERIFY_RESET_TOKEN: { 
    url: "/api/auth/verify_reset_token", 
    addTimestamp: true 
  },

  // 二维码认证
  QR_GENERATE: { url: "/api/auth/qrcode/generate", addTimestamp: false },
  QR_CHECK: { url: "/api/auth/qrcode/check", addTimestamp: true },
  QR_SCAN: { url: "/api/auth/qrcode/scan", addTimestamp: false },
  QR_CONFIRM: { url: "/api/auth/qrcode/confirm", addTimestamp: false },

  // 抽卡记录相关API
  GACHA_IMPORT_OFFICIAL: {
    url: "/api/gachalog/import/official-link",
    addTimestamp: false
  },
  GACHA_IMPORT_TASK: {
    url: "/api/gachalog/import/tasks/<task_id>",
    addTimestamp: true,
    dynamicPath: true
  },
  GACHA_RECORDS: {
    url: "/api/gachalog/records/<game_id>/<uid>",
    addTimestamp: true,
    dynamicPath: true
  },
  GACHA_STATS: {
    url: "/api/gachalog/stats/<game_id>/<uid>",
    addTimestamp: true,
    dynamicPath: true
  },
  GACHA_EXPORT: {
    url: "/api/gachalog/export/<game_id>/<uid>",
    addTimestamp: true,
    dynamicPath: true
  },
  GACHA_UID_LIST: {
    url: "/api/gachalog/uid/list",
    addTimestamp: true
  },
  GACHA_UID_UPDATE: {
    url: "/api/gachalog/uid/update",
    addTimestamp: false
  },
  GACHA_UID_REVOKE: {
    url: "/api/gachalog/uid/revoke",
    addTimestamp: false
  },
  // 清空抽卡记录
  GACHA_LOG_CLEAR: {
    url: "/api/gachalog/clear/<game_id>/<uid>",
    addTimestamp: false,
    dynamicPath: true
  }
};

export function getApiUrl(endpointKey, pathParams = {}) {
  const endpoint = API_ENDPOINTS[endpointKey];
  if (!endpoint) throw new Error(`Unknown endpoint: ${endpointKey}`);

  let url = endpoint.url;

  // 处理动态路径参数
  if (endpoint.dynamicPath) {
    for (const [key, value] of Object.entries(pathParams)) {
      url = url.replace(`<${key}>`, value);
    }
  }

  // 添加时间戳防止缓存
  if (endpoint.addTimestamp) {
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}t=${Date.now()}`;
  }

  return url;
}