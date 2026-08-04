<script setup>
import { RouterView, useRoute } from 'vue-router'

import BottomTabBar from '@/components/common/BottomTabBar.vue'

const route = useRoute()
</script>

<template>
  <RouterView />
  <BottomTabBar v-if="!route.meta.hideBottomTabBar" />
</template>
