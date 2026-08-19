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
  <div v-if="event" class="flex items-center gap-4 rounded-2xl bg-error/10 p-2">
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-error text-white"
    >
      <BaseAlertIcon class="h-4 w-4" />
    </span>

    <p class="text-body font-semibold text-ink">{{ event.summary }}</p>
  </div>
</template>
