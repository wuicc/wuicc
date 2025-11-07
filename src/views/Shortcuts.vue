<template>
  <v-container class="pa-4">
    <v-row>
      <v-col cols="12" md="6" v-for="(game, index) in filteredGames" :key="index">
        <v-card class="h-100 text-white" :style="getCardStyle(game.color)" dark>
          <v-card-title class="text-h5 d-flex align-center flex-wrap">
            <div class="d-flex align-center">
              {{ $t(`app.games.${game.id}.title`) }}
              <v-btn variant="text" class="ml-2 mr-1" @click="openGameLaunchDialog(game.id)"
                prepend-icon="mdi-television-play">
                {{
                  $t("app.pages.timeline.launch_game")
                }}
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text>
            <v-list bg-color="transparent">
              <!-- 游戏官网链接 -->
              <v-list-item v-for="(official, officialIndex) in game.official" :key="'official-' + officialIndex"
                :href="official.url" target="_blank" rel="noopener noreferrer">
                <template v-slot:prepend>
                  <v-icon>mdi-web</v-icon>
                </template>
                <v-list-item-title>
                  {{ $t(`app.pages.shortcuts.links.${official.id}`) }}
                </v-list-item-title>
              </v-list-item>

              <!-- 其他工具链接 -->
              <v-list-item v-for="(link, linkIndex) in game.links" :key="'link-' + linkIndex" :href="link.url"
                target="_blank" rel="noopener noreferrer">
                <template v-slot:prepend>
                  <v-icon>mdi-tools</v-icon>
                </template>
                <v-list-item-title>{{ link.name }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 游戏启动弹窗组件 -->
    <GameLaunchDialog v-model="gameLaunchDialog" :game-id="currentGameId" />
  </v-container>
</template>

<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import GameLaunchDialog from "@/components/GameLaunchDialog.vue";
import StorageManager from "@/utils/StorageManager";

const { t } = useI18n();

// 游戏启动相关状态
const gameLaunchDialog = ref(false);
const currentGameId = ref("");

const games = [
  {
    id: "genshin",
    color: "#a068f8",
    official: [
      { id: "mihoyo_genshin", url: "https://ys.mihoyo.com/" },
      { id: "hoyoverse_genshin", url: "https://genshin.hoyoverse.com/" },
    ],
    links: [{ name: "Paimon.moe", url: "https://paimon.moe" }],
  },
  {
    id: "starrail",
    color: "#e0a064",
    official: [
      { id: "mihoyo_starrail", url: "https://sr.mihoyo.com/" },
      { id: "hoyoverse_starrail", url: "https://hsr.hoyoverse.com/" },
    ],
    links: [{ name: "Star Rail Station", url: "https://starrailstation.com/" }],
  },
  {
    id: "zenless",
    color: "#4caf50",
    official: [
      { id: "mihoyo_zenless", url: "https://zzz.mihoyo.com/" },
      { id: "hoyoverse_zenless", url: "https://zenless.hoyoverse.com/" },
    ],
    links: [{ name: "StarDB.gg", url: "https://stardb.gg/zzz/signal-tracker" }],
  },
  {
    id: "wuthering",
    color: "#18a0e8",
    official: [
      { id: "kurogame_cn_wuthering", url: "https://mc.kurogame.com" },
      {
        id: "kurogame_os_wuthering",
        url: "https://wutheringwaves.kurogame.com",
      },
    ],
    links: [{ name: "WuWa Tracker", url: "https://wuwatracker.com/" }],
  },
];

const filteredGames = computed(() => {
  const userId = StorageManager.get("user_id");
  if (userId == 1) {
    return games;
  }
  return games; // games.filter((game) => game.id !== "wuthering");
});

function openGameLaunchDialog(gameId) {
  currentGameId.value = gameId;
  gameLaunchDialog.value = true;
}

function getCardStyle(color) {
  return {
    "--color": color,
    "--color-darkened": `color-mix(in srgb, ${color} 70%, #000)`,
    "background-color": color,
  };
}
</script>

<style scoped>
.h-100 {
  height: 100%;
}

.v-card {
  transition: none;
}

/* 官网链接使用不同图标颜色 */
.v-list-item--active .v-icon {
  color: inherit !important;
}

.v-theme--dark .v-card {
  background-color: var(--color-darkened) !important;
}
</style>