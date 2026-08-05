<script setup>
import { computed } from "vue";
import BaseAlertIcon from "@/components/common/BaseAlertIcon.vue";

const props = defineProps({
  event: {
    type: Object,
    default: null,
  },
});

const TAG_TONE_STYLES = {
  UP: { bg: "bg-pink-soft", iconBg: "bg-pink", iconText: "text-white" },
  DOWN: { bg: "bg-blue-soft", iconBg: "bg-blue", iconText: "text-white" },
  WARN: { bg: "bg-yellow-soft", iconBg: "bg-yellow", iconText: "text-ink" },
};

const toneStyle = computed(
  () => TAG_TONE_STYLES[props.event?.tagTone] ?? TAG_TONE_STYLES.WARN,
);
</script>

<template>
  <div
    v-if="event"
    :class="[toneStyle.bg, 'flex items-center gap-4 rounded-2xl p-3']"
  >
    <span
      :class="[
        toneStyle.iconBg,
        toneStyle.iconText,
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
      ]"
    >
      <BaseAlertIcon class="h-6 w-6" />
    </span>

    <div class="flex flex-col gap-2">
      <p class="text-caption text-muted">신규 이벤트 발생!</p>
      <p class="text-caption font-semibold text-ink">{{ event.summary }}</p>
    </div>
  </div>
</template>