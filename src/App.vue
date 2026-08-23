<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import AppSplash from "@/components/AppSplash.vue";
import BottomTabBar from "@/components/common/BottomTabBar.vue";
import { useAssessmentStore } from "@/stores/assessment";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";

const route = useRoute();
const hasBottomTabBar = computed(() => !route.meta.hideBottomTabBar);

// 알림 polling은 특정 bell 컴포넌트의 mount/unmount가 아니라 로그인 세션 생명주기에 묶는다 —
// 그래야 화면을 이동해도 timer가 중복 생성되거나 끊기지 않는다.
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const assessmentStore = useAssessmentStore();
const SPLASH_DURATION_MS = 1200;
const hasSplashDurationElapsed = ref(false);
let splashTimer;

const isSplashVisible = computed(
  () => !authStore.isInitialized || !hasSplashDurationElapsed.value,
);

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      notificationStore.startPolling();
      assessmentStore.loadResult();
    } else {
      notificationStore.stopPolling();
      notificationStore.resetUnread();
      assessmentStore.reset();
    }
  },
  { immediate: true },
);

onMounted(() => {
  splashTimer = window.setTimeout(() => {
    hasSplashDurationElapsed.value = true;
  }, SPLASH_DURATION_MS);
});

onBeforeUnmount(() => {
  window.clearTimeout(splashTimer);
});
</script>

<template>
  <AppSplash v-if="isSplashVisible" />

  <template v-else>
    <RouterView />
    <BottomTabBar v-if="hasBottomTabBar" />
  </template>
</template>
