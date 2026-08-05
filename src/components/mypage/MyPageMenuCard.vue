<script setup>
import BaseCard from "@/components/common/BaseCard.vue";

defineProps({
  items: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["select"]);

function handleSelect(item) {
  emit("select", item);
}
</script>

<template>
  <BaseCard color="white">
    <ul>
      <li
        v-for="(item, index) in items"
        :key="item.id"
        :class="index ? 'border-t border-line' : ''"
      >
        <button
          type="button"
          class="flex w-full items-center gap-4 py-3 text-left"
          @click="handleSelect(item)"
        >
          <span class="shrink-0 text-yellow" aria-hidden="true">
            <svg
              v-if="item.icon === 'report'"
              class="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M5 20V13M10 20V5M15 20V10M20 20V7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
            </svg>
            <svg
              v-else-if="item.icon === 'notification'"
              class="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M6 9C6 5.7 8.7 3 12 3C15.3 3 18 5.7 18 9V14L20 17H4L6 14V9Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" />
              <path d="M10 20H14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
            </svg>
            <svg
              v-else-if="item.icon === 'notice'"
              class="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M4 13V9L17 4V18L4 13Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" />
              <path d="M17 8H20M17 14H20M6 13L8 20H11L9 14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg
              v-else-if="item.icon === 'support'"
              class="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M21 11C21 15.4 17 19 12 19C10.8 19 9.7 18.8 8.7 18.4L4 21L5.2 16.8C3.8 15.3 3 13.3 3 11C3 6.6 7 3 12 3C17 3 21 6.6 21 11Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" />
            </svg>
            <svg
              v-else
              class="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M12 3L20 6V11C20 16 16.6 20.1 12 21C7.4 20.1 4 16 4 11V6L12 3Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" />
            </svg>
          </span>

          <span class="min-w-0 flex-1 text-body font-semibold text-ink">
            {{ item.label }}
          </span>

          <svg
            class="h-6 w-6 shrink-0 text-muted"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </li>
    </ul>
  </BaseCard>
</template>
