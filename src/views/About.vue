<template>
  <v-card>
    <v-card-title class="text-h5">
      {{ $t("app.pages.about.title") }}
    </v-card-title>

    <v-card-text>
      <!-- 声明部分 - 使用HTML内容 -->
      <div v-html="$t('app.pages.about.disclaimer')" class="disclaimer-content"></div>

      <v-row>
        <v-col cols="12" md="6">
          <v-card class="mb-4" variant="outlined">
            <v-card-title class="text-h6">
              <v-icon left>mdi-information</v-icon>
              {{ $t("app.pages.about.projectInfo") }}
            </v-card-title>
            <v-card-text>
              <p>{{ $t("app.pages.about.description") }}</p>
              <p class="mt-2">
                <v-icon small>mdi-github</v-icon>
                <a
                  href="https://github.com/wuicc/wuicc"
                  target="_blank"
                  class="ml-2"
                  rel="noreferrer noopener"
                >
                  GitHub Repository
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
                <v-list-item
                  v-for="member in teamMembers"
                  :key="member.name"
                  :prepend-avatar="member.avatar"
                  :title="member.name"
                  :subtitle="member.role"
                ></v-list-item>
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
    avatar: "https://ae01.alicdn.com/kf/U0b647d17741041febeafe81f265868c6K.jpg",
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
  color: #33beff
}

.disclaimer-content {
  background-color: #fff8e1; /* 浅黄色背景，类似警告样式 */
  border-left: 4px solid #ffc107; /* 左侧黄色边框 */
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 4px;
}

.disclaimer-content h4 {
  color: #ff6d00; /* 标题颜色 */
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
</style>