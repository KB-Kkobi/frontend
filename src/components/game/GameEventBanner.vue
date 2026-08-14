<script setup>
import BaseAlertIcon from '@/components/common/BaseAlertIcon.vue';

defineProps({
  event: {
    type: Object,
    default: null,
  },
});
</script>

<template>
  <div v-if="event" class="flex items-center gap-4 rounded-2xl bg-error/10 p-3">
    <span
      class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error text-white"
    >
      <BaseAlertIcon class="h-6 w-6" />
    </span>

    <div class="flex flex-col gap-2">
      <p class="text-caption text-muted">신규 이벤트 발생!</p>
      <p class="text-body font-semibold text-ink">{{ event.summary }}</p>
    </div>
  </div>
</template>
