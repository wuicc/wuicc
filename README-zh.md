# WUICC

[![Vue 3](https://img.shields.io/badge/Vue-3-green)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-blue)](https://vitejs.dev/)
[![Vuetify](https://img.shields.io/badge/Vuetify-3-purple)](https://vuetifyjs.com/)
[![i18n](https://img.shields.io/badge/i18n-Support-yellow)](https://vue-i18n.intlify.dev/)

## 项目简介

WUICC是一款一站式游戏管理工具，为玩家提供多游戏活动追踪、抽卡记录管理、游戏快捷启动等功能，帮助玩家更便捷地管理游戏体验。

## 主要功能

### 📅 多游戏时间线
- 追踪多个热门游戏的限时活动、版本更新和限定卡池
- 支持多种游戏服务器（国内/国际）
- 自动转换为本地时区，一目了然

### 🎮 游戏快捷启动
- 支持一键启动PC客户端、移动客户端和云游戏
- 支持原神、崩坏星穹铁道、绝区零、鸣潮等热门游戏

### 📊 抽卡计数器
- 记录和管理游戏抽卡记录
- 追踪抽卡统计数据和保底情况
- 多账号支持

### ⏰ 自定义提醒
- 设置游戏和事件类型偏好
- 不错过重要活动

### 🌐 多时区支持
- 查看全球服务器事件
- 自动本地时区转换

### 🎨 简洁界面
- 精心设计的用户界面
- 直观易用的操作体验

### 🌍 国际化
- 支持英语、中文（简体和繁体）、日语、韩语、德语、法语、西班牙语等多种语言

### 🔒 标签锁管理
- 防止多个标签页同时操作
- 确保数据一致性

## 支持的游戏

- **原神 (Genshin Impact)**
- **崩坏：星穹铁道 (Honkai: Star Rail)**
- **绝区零 (Zenless Zone Zero)**
- **鸣潮 (Wuthering Waves)**

## 技术栈

- **前端框架**: Vue 3
- **构建工具**: Vite
- **UI组件库**: Vuetify 3
- **路由**: Vue Router 4
- **国际化**: Vue I18n
- **HTTP客户端**: Axios
- **日期处理**: date-fns, dayjs
- **二维码处理**: jsqr, qrcode.vue
- **拖拽功能**: vue-draggable-plus
- **验证码**: vue-turnstile
- **跨标签通信**: broadcast-channel

## 快速开始

### 前提条件

- Node.js 22+ 或更高版本
- pnpm 10+ 或更高版本

### 安装依赖

```bash
pnpm install
```

### 开发环境运行

```bash
pnpm dev
```

应用将在开发服务器上运行，通常访问地址为 `http://localhost:5173`。

### 构建生产版本

```bash
pnpm build
```

构建后的文件将生成在 `dist` 目录中。

### 预览生产版本

```bash
pnpm preview
```

预览服务器将在 `http://localhost:14173` 启动。

## 环境变量配置

在项目根目录创建 `.env` 文件，并根据 `.env.example` 配置必要的环境变量：

```env
VITE_TURNSTILE_SITE_KEY=
VITE_JUMP_TIP=
VITE_BEIAN_TEXT=
VITE_DOMESTIC_DOMAIN=
VITE_INTERNATIONAL_DOMAIN=
```

- `VITE_TURNSTILE_SITE_KEY`: Cloudflare Turnstile验证码的站点密钥
- `VITE_JUMP_TIP`: 顶部跳转提示信息
- `VITE_BEIAN_TEXT`: 网站备案信息文本
- `VITE_DOMESTIC_DOMAIN`: 国内域名配置
- `VITE_INTERNATIONAL_DOMAIN`: 国际域名配置

## 项目结构

```
├── .env.example          # 环境变量示例文件
├── .gitignore            # Git忽略文件配置
├── README.md             # 项目说明文档
├── index.html            # 入口HTML文件
├── package.json          # 项目依赖和脚本配置
├── public/               # 静态资源目录
│   ├── assets/           # 图片和游戏资源
│   └── favicon.ico       # 网站图标
├── src/                  # 源代码目录
│   ├── App.vue           # 应用根组件
│   ├── assets/           # 内部资源文件
│   ├── components/       # 自定义组件
│   │   ├── ActivityItem.vue      # 活动项组件
│   │   ├── GachaSettings.vue     # 抽卡设置组件
│   │   ├── GameLaunchDialog.vue  # 游戏启动对话框
│   │   ├── GameSelector.vue      # 游戏选择器
│   │   └── LoginPanel.vue        # 登录面板
│   ├── layouts/          # 布局组件
│   │   └── Layout.vue    # 主布局组件
│   ├── locales/          # 国际化翻译文件
│   ├── main.js           # 应用入口文件
│   ├── plugins/          # Vue插件配置
│   │   └── vuetify.js    # Vuetify配置
│   ├── router/           # 路由配置
│   │   └── index.js      # 路由定义
│   ├── utils/            # 工具函数
│   └── views/            # 页面组件
│       ├── Home.vue              # 首页
│       ├── GachaOverview.vue     # 抽卡概览
│       ├── GachaRecords.vue      # 抽卡记录
│       └── Shortcuts.vue         # 快捷方式
└── vite.config.js        # Vite配置文件
```

## 国际化

项目支持多语言切换，翻译文件位于 `src/locales/` 目录下。目前支持的语言包括：

- 英语 (en.json)
- 简体中文 (zh-Hans.json)
- 繁体中文 (zh-Hant.json)
- 日语 (ja.json)
- 韩语 (ko.json)
- 德语 (de.json)
- 法语 (fr.json)
- 西班牙语 (es.json)

## 浏览器支持

- Google Chrome (推荐最新版本)
- Mozilla Firefox (推荐最新版本)
- Apple Safari (推荐最新版本)
- Microsoft Edge (推荐最新版本)

## Progressive Web App (PWA)

项目支持PWA功能，可以安装到桌面或移动设备上，提供更接近原生应用的体验。

## License

[MIT](LICENSE)