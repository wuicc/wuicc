<template>
    <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" md="8" lg="6" class="text-center">
          <v-card elevation="12" class="pa-8">
            <v-icon size="100" color="error">mdi-alert-circle-outline</v-icon>
            <h1 class="text-h3 mt-4">{{ $t('app.pages.notFound.title') }}</h1>
            <p class="text-h6 mt-4">{{ $t('app.pages.notFound.message') }}</p>
            <v-btn 
              color="primary" 
              size="large" 
              class="mt-6"
              @click="$router.push('/')"
            >
              {{ $t('app.pages.notFound.backHome') }}
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script setup>
  // 不需要额外的逻辑，保持简单
  </script>