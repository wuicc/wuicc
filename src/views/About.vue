<template>
  <v-card class="about-card">
    <v-card-title class="my-2 d-flex align-center flex-wrap">
      <div class="d-flex align-center mr-2">
        <v-icon class="mr-2">mdi-information</v-icon>
        {{ $t("app.pages.about.title") }}
      </div>
    </v-card-title>

    <v-card-text>
      <!-- 声明部分 - 使用HTML内容 -->
      <div v-html="$t('app.pages.about.disclaimer')" class="disclaimer-content"></div>

      <v-row>
        <v-col cols="12" md="6">
          <v-card class="mb-1" variant="outlined">
            <v-card-title class="text-h6">
              <v-icon left>mdi-alpha-w-box</v-icon>
              {{ $t("app.pages.about.projectInfo") }}
            </v-card-title>
            <v-card-text>
              <p>{{ $t("app.pages.about.description") }}</p>
              <p class="mt-2">
                <!-- <v-icon small>mdi-github</v-icon> -->
                <a href="https://github.com/wuicc/wuicc" target="_blank" class="" rel="noreferrer noopener"
                  style="line-height: 30px">
                  <span style="vertical-align: middle">GitHub Repository</span>&nbsp;&nbsp;
                  <v-img class="mr-2" width="100px" style="display: inline-block; vertical-align: middle"
                    src="https://img.shields.io/github/stars/wuicc/wuicc?style=social&label=Stars%20%E2%AD%90"></v-img>
                </a>
              </p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-title class="text-h6">
              <v-icon left>mdi-account-group</v-icon>
              {{ $t("app.pages.about.team") }}
            </v-card-title>
            <v-card-text>
              <p>{{ $t("app.pages.about.teamDescription") }}</p>
              <v-list density="compact" class="mt-2">
                <v-list-item v-for="member in teamMembers" :key="member.name" :prepend-avatar="member.avatar"
                  :title="member.name" :subtitle="member.role">
                  <template v-slot:prepend>
                    <v-avatar :size="48">
                      <v-img :src="member.avatar"></v-img>
                    </v-avatar>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
const teamMembers = [
  {
    name: "Shoyu",
    role: "Project Lead & Developer",
    avatar: "/assets/images/avatar.webp",
  },
];
</script>

<style scoped>
a {
  color: #00b0ff;
  text-decoration: none;
  transition: color 0.3s ease;
}

a:hover {
  color: #33beff;
}

.about-card {
  max-width: 1200px;
  margin: 0 auto;
}

.v-card {
  border-radius: 24px;
}

.disclaimer-content {
  background-color: #fff8e1;
  /* 浅黄色背景，类似警告样式 */
  border-left: 4px solid #ffc107;
  /* 左侧黄色边框 */
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 4px;
  color: #222;
}

.v-theme--dark .disclaimer-content {
  color: white;
  background-color: #6a5100;
}

.disclaimer-content h4 {
  color: #ff6d00;
  /* 标题颜色 */
  margin-bottom: 12px;
  font-size: 1.1rem;
  font-weight: 500;
}

.disclaimer-content ul {
  padding-left: 20px;
  margin: 8px 0;
}

.disclaimer-content li {
  margin-bottom: 6px;
  line-height: 1.6;
}

.v-card {
  background-color: #fffa;
}

.v-list {
  background-color: #0000;
}

.v-theme--dark .v-card {
  background-color: #444a;
}
</style>