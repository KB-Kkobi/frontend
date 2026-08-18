<script setup>
import { computed, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import BottomTabBar from "@/components/common/BottomTabBar.vue";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";

const route = useRoute();
const hasBottomTabBar = computed(() => !route.meta.hideBottomTabBar);

// 알림 polling은 특정 bell 컴포넌트의 mount/unmount가 아니라 로그인 세션 생명주기에 묶는다 —
// 그래야 화면을 이동해도 timer가 중복 생성되거나 끊기지 않는다.
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      notificationStore.startPolling();
    } else {
      notificationStore.stopPolling();
      notificationStore.resetUnread();
    }
  },
  { immediate: true },
);
</script>

<template>
  <RouterView />
  <BottomTabBar v-if="hasBottomTabBar" />
</template>
