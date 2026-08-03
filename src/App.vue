<script setup>
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import BottomTabBar from "@/components/common/BottomTabBar.vue";

const route = useRoute();
const hasBottomTabBar = computed(() => !route.meta.hideBottomTabBar);
</script>

<template>
  <RouterView />
  <BottomTabBar v-if="hasBottomTabBar" />
</template>
