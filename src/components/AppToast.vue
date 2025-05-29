<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    :color="color"
    location="bottom right"
  >
    {{ message }}
    <template v-slot:actions>
      <v-btn color="white" variant="text" @click="show = false">
        {{ $t("app.close") }}
      </v-btn>
    </template>
  </v-snackbar>
</template>
  
  <script setup>
import { ref } from "vue";

const show = ref(false);
const message = ref("");
const color = ref("success");
const timeout = ref(3000);

const showToast = (msg, toastColor = "success", duration = 3000) => {
  message.value = msg;
  color.value = toastColor;
  timeout.value = duration;
  show.value = true;
};

// 暴露方法供外部调用
defineExpose({
  showToast,
});
</script>