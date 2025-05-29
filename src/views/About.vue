<template>
  <v-card>
    <v-card-title class="text-h5">
      {{ $t("app.pages.about.title") }}
    </v-card-title>

    <v-card-text>
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
  color: inherit;
  text-decoration: none;
  transition: color 0.3s ease;
}

a:hover {
  color: var(--v-primary-base);
}
</style>