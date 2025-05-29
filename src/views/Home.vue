<template>
  <div v-if="showWelcome">
    <v-dialog v-model="dialog" persistent max-width="800" scrollable>
      <v-card>
        <v-card-title class="text-h5">
          {{ $t("app.welcome.title") }}
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <GameSelector
            :show-info="true"
            :save-button-text="$t('app.welcome.confirm')"
            @save="handleSave"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>

  <div v-else>
    <!-- 正常首页内容 -->
    <v-card class="ma-4">
      <div class="d-flex justify-center py-6">
        <v-avatar size="120" color="#fff" class="elevation-3">
          <v-img src="/logo-black.svg" alt="App Logo" contain />
        </v-avatar>
      </div>

      <v-card-title class="text-center">
        {{ $t("app.pages.home.title") }}
      </v-card-title>

      <v-card-text class="text-center px-4 pb-6">
        {{ $t("app.pages.home.welcome") }}
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import GameSelector from "@/components/GameSelector.vue";

const dialog = ref(false);
const showWelcome = ref(false);

const handleSave = () => {
  localStorage.setItem("hasVisitedBefore", "true");
  showWelcome.value = false;
  dialog.value = false;
};

onMounted(() => {
  const hasVisitedBefore = localStorage.getItem("hasVisitedBefore");
  if (!hasVisitedBefore) {
    showWelcome.value = true;
    dialog.value = true;
  }
});
</script>
<style scoped>
/* 可选：添加logo悬停效果 */
.v-avatar {
  transition: transform 0.3s ease;
}
.v-avatar:hover {
  transform: scale(1.05);
}
</style>