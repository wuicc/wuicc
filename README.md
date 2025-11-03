# WUICC

[![Vue 3](https://img.shields.io/badge/Vue-3-green)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-blue)](https://vitejs.dev/)
[![Vuetify](https://img.shields.io/badge/Vuetify-3-purple)](https://vuetifyjs.com/)
[![i18n](https://img.shields.io/badge/i18n-Support-yellow)](https://vue-i18n.intlify.dev/)

## Project Introduction

WUICC is an all-in-one game management tool that provides features such as multi-game activity tracking, gacha record management, and quick game launching to help players manage their gaming experience more conveniently.

## Main Features

### 📅 Multi-game Timeline
- Track limited-time events, version updates, and limited gacha pools for multiple popular games
- Support for multiple game servers (domestic/international)
- Automatic conversion to local time zone for clear visibility

### 🎮 Quick Game Launch
- Support one-click launch of PC clients, mobile clients, and cloud games
- Support for popular games like Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, Wuthering Waves, etc.

### 📊 Gacha Counter
- Record and manage game gacha records
- Track gacha statistics and pity counts
- Multi-account support

### ⏰ Custom Reminders
- Set preferences for game and event types
- Never miss important activities

### 🌐 Multi-timezone Support
- View global server events
- Automatic local timezone conversion

### 🎨 Clean Interface
- Carefully designed user interface
- Intuitive and easy-to-use operation experience

### 🌍 Internationalization
- Support for multiple languages including English, Chinese (Simplified and Traditional), Japanese, Korean, German, French, Spanish, etc.

### 🔒 Tab Lock Management
- Prevent simultaneous operation in multiple tabs
- Ensure data consistency

## Supported Games

- **Genshin Impact**
- **Honkai: Star Rail**
- **Zenless Zone Zero**
- **Wuthering Waves**

## Technology Stack

- **Frontend Framework**: Vue 3
- **Build Tool**: Vite
- **UI Component Library**: Vuetify 3
- **Routing**: Vue Router 4
- **Internationalization**: Vue I18n
- **HTTP Client**: Axios
- **Date Processing**: date-fns, dayjs
- **QR Code Processing**: jsqr, qrcode.vue
- **Drag and Drop**: vue-draggable-plus
- **Verification Code**: vue-turnstile
- **Cross-tab Communication**: broadcast-channel

## Quick Start

### Prerequisites

- Node.js 22+ or higher
- pnpm 10+ or higher

### Install Dependencies

```bash
pnpm install
```

### Run in Development Environment

```bash
pnpm dev
```

The application will run on a development server, typically accessible at `http://localhost:5173`.

### Build Production Version

```bash
pnpm build
```

The built files will be generated in the `dist` directory.

### Preview Production Version

```bash
pnpm preview
```

The preview server will start at `http://localhost:14173`.

## Environment Variables Configuration

Create a `.env` file in the project root directory and configure necessary environment variables according to `.env.example`:

```env
VITE_TURNSTILE_SITE_KEY=
VITE_JUMP_TIP=
VITE_BEIAN_TEXT=
VITE_DOMESTIC_DOMAIN=
VITE_INTERNATIONAL_DOMAIN=
```

- `VITE_TURNSTILE_SITE_KEY`: Site key for Cloudflare Turnstile captcha
- `VITE_JUMP_TIP`: Top jump prompt message
- `VITE_BEIAN_TEXT`: Website ICP filing information text
- `VITE_DOMESTIC_DOMAIN`: Domestic domain configuration
- `VITE_INTERNATIONAL_DOMAIN`: International domain configuration

## Project Structure

```
├── .env.example          # Environment variable example file
├── .gitignore            # Git ignore file configuration
├── README.md             # Project description document
├── index.html            # Entry HTML file
├── package.json          # Project dependencies and scripts configuration
├── public/               # Static resources directory
│   ├── assets/           # Images and game resources
│   └── favicon.ico       # Website icon
├── src/                  # Source code directory
│   ├── App.vue           # Application root component
│   ├── assets/           # Internal resource files
│   ├── components/       # Custom components
│   │   ├── ActivityItem.vue      # Activity item component
│   │   ├── GachaSettings.vue     # Gacha settings component
│   │   ├── GameLaunchDialog.vue  # Game launch dialog
│   │   ├── GameSelector.vue      # Game selector
│   │   └── LoginPanel.vue        # Login panel
│   ├── layouts/          # Layout components
│   │   └── Layout.vue    # Main layout component
│   ├── locales/          # Internationalization translation files
│   ├── main.js           # Application entry file
│   ├── plugins/          # Vue plugin configuration
│   │   └── vuetify.js    # Vuetify configuration
│   ├── router/           # Routing configuration
│   │   └── index.js      # Route definitions
│   ├── utils/            # Utility functions
│   └── views/            # Page components
│       ├── Home.vue              # Home page
│       ├── GachaOverview.vue     # Gacha overview
│       ├── GachaRecords.vue      # Gacha records
│       └── Shortcuts.vue         # Shortcuts
└── vite.config.js        # Vite configuration file
```

## Internationalization

The project supports multiple languages. Translation files are located in the `src/locales/` directory. Currently supported languages include:

- English (en.json)
- Simplified Chinese (zh-Hans.json)
- Traditional Chinese (zh-Hant.json)
- Japanese (ja.json)
- Korean (ko.json)
- German (de.json)
- French (fr.json)
- Spanish (es.json)

## Browser Support

- Google Chrome (latest version recommended)
- Mozilla Firefox (latest version recommended)
- Apple Safari (latest version recommended)
- Microsoft Edge (latest version recommended)

## Progressive Web App (PWA)

The project supports PWA functionality and can be installed on desktop or mobile devices for a more native app-like experience.

## License

[MIT](LICENSE)