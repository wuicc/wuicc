<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-card>
      <v-card-title>
        <v-icon>mdi-television-play</v-icon>
        {{ $t("app.pages.timeline.launch_game") }} -
        {{ $t(`app.games.${gameId}.title`) }}
      </v-card-title>

      <v-card-text class="pt-1 pb-1">
        <!-- 中国服区域 -->
        <div v-if="gameLinksData?.cn" class="mb-2">
          <div class="text-subtitle-1 mb-2">
            {{ $t("app.pages.timeline.china_server") }}
          </div>
          <v-btn
            v-if="gameLinksData.cn.pc"
            block
            variant="elevated"
            class="mb-2"
            color="blue"
            @click="launch('cn', 'pc')"
          >
            <v-icon start icon="mdi-laptop"></v-icon>
            {{ $t("app.pages.timeline.launch_pc") }}
          </v-btn>
          <v-btn
            v-if="gameLinksData.cn.mobile"
            block
            variant="elevated"
            class="mb-2"
            color="green"
            @click="launch('cn', 'mobile')"
          >
            <v-icon start icon="mdi-cellphone"></v-icon>
            {{ $t("app.pages.timeline.launch_mobile") }}
          </v-btn>
          <v-btn
            v-if="gameLinksData.cn.cloud_mobile"
            block
            variant="elevated"
            class="mb-2"
            color="purple"
            @click="launch('cn', 'cloud_mobile')"
          >
            <v-icon start icon="mdi-cloud"></v-icon>
            {{ $t("app.pages.timeline.launch_cloud_mobile") }}
          </v-btn>
          <v-btn
            v-if="gameLinksData.cn.cloud_url"
            block
            variant="elevated"
            color="indigo"
            @click="launch('cn', 'cloud_url')"
          >
            <v-icon start icon="mdi-web"></v-icon>
            {{ $t("app.pages.timeline.launch_cloud_web") }}
          </v-btn>
        </div>

        <!-- 国际服区域 -->
        <div v-if="gameLinksData?.global">
          <div class="text-subtitle-1 mb-2">
            {{ $t("app.pages.timeline.global_server") }}
          </div>
          <v-btn
            v-if="gameLinksData.global.pc"
            block
            variant="elevated"
            class="mb-2"
            color="blue"
            @click="launch('global', 'pc')"
          >
            <v-icon start icon="mdi-laptop"></v-icon>
            {{ $t("app.pages.timeline.launch_pc") }}
          </v-btn>
          <v-btn
            v-if="gameLinksData.global.mobile"
            block
            variant="elevated"
            class="mb-2"
            color="green"
            @click="launch('global', 'mobile')"
          >
            <v-icon start icon="mdi-cellphone"></v-icon>
            {{ $t("app.pages.timeline.launch_mobile") }}
          </v-btn>
          <v-btn
            v-if="gameLinksData.global.cloud_mobile"
            block
            variant="elevated"
            class="mb-2"
            color="purple"
            @click="launch('global', 'cloud_mobile')"
          >
            <v-icon start icon="mdi-cloud"></v-icon>
            {{ $t("app.pages.timeline.launch_cloud_mobile") }}
          </v-btn>
          <v-btn
            v-if="gameLinksData.global.cloud_url"
            block
            variant="elevated"
            color="indigo"
            @click="launch('global', 'cloud_url')"
          >
            <v-icon start icon="mdi-web"></v-icon>
            {{ $t("app.pages.timeline.launch_cloud_web") }}
          </v-btn>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="accent" @click="close">
          {{ $t("app.common.close") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
  
  <script setup>
import { ref, watch } from "vue";
import { getAllGameLinks, getGameLink } from "@/utils/gameStartLinks";

const props = defineProps({
  gameId: {
    type: String,
    required: true,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const dialog = ref(props.modelValue);
const gameLinksData = ref(null);

watch(
  () => props.modelValue,
  (val) => {
    dialog.value = val;
    if (val) {
      gameLinksData.value = getAllGameLinks(props.gameId);
    }
  }
);

watch(dialog, (val) => {
  emit("update:modelValue", val);
});

const launch = (region, platform) => {
  const link = getGameLink(props.gameId, region, platform);
  if (link) {
    if (link.startsWith("http")) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = link;
      const iframe = document.createElement("iframe");
      iframe.src = link;
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 100);
    }
  }
};

const close = () => {
  dialog.value = false;
};
</script>