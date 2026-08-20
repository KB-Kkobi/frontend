<script setup>
import { computed } from "vue";
import { formatRelativeTime } from "@/utils/date";

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["select"]);

const relativeTime = computed(() => formatRelativeTime(props.notification.createdAt));

function handleSelect() {
  emit("select", props.notification);
}
</script>

<template>
  <button
    type="button"
    class="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors active:bg-surface"
    @click="handleSelect"
  >
    <span
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-soft text-pink"
      aria-hidden="true"
    >
      <svg
        v-if="notification.type === 'TRADE_BUY_FILLED' || notification.type === 'TRADE_SELL_FILLED'"
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="M4 5V19H20" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M7 15L10.5 11.5L13.5 14L19 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <svg
        v-else-if="notification.type === 'FRIEND_REQUEST_RECEIVED'"
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="10" cy="9" r="3.5" stroke="currentColor" stroke-width="1.75" />
        <path d="M3.5 20C3.5 16.4 6.5 13.5 10 13.5C13.5 13.5 16.5 16.4 16.5 20" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        <path d="M18 8V14M15 11H21" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
      </svg>
      <svg
        v-else
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="10" cy="9" r="3.5" stroke="currentColor" stroke-width="1.75" />
        <path d="M3.5 20C3.5 16.4 6.5 13.5 10 13.5C13.5 13.5 16.5 16.4 16.5 20" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        <path d="M15.5 11L17.5 13L21 9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>

    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <span
        class="truncate text-body text-ink"
        :class="notification.read ? 'font-normal' : 'font-semibold'"
      >
        {{ notification.title }}
      </span>
      <p class="line-clamp-2 break-keep text-caption text-muted">{{ notification.message }}</p>
      <div class="flex items-center justify-between gap-2 pt-1">
        <span class="text-caption text-muted tabular-nums">{{ relativeTime }}</span>
        <span
          v-if="!notification.read"
          class="h-1.5 w-1.5 shrink-0 rounded-full bg-pink"
          aria-hidden="true"
        />
      </div>
    </div>
  </button>
</template>
