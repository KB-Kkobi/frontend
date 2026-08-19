<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  prefix: {
    type: String,
    default: "",
  },
  highlight: {
    type: String,
    default: "",
  },
  suffix: {
    type: String,
    default: "",
  },
  summary: {
    type: String,
    default: "",
  },
});

const normalizedPrefix = computed(() => props.prefix.trimEnd());
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <svg
          class="h-6 w-6 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8.5 15.5C7 14.4 6 12.6 6 10.5C6 7.2 8.7 4.5 12 4.5C15.3 4.5 18 7.2 18 10.5C18 12.6 17 14.4 15.5 15.5C14.7 16.1 14.3 16.7 14.2 18H9.8C9.7 16.7 9.3 16.1 8.5 15.5Z"
            class="text-yellow"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M9 18H15M10 21H14"
            class="text-muted"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12 1.5V2.5M4.9 3.4L5.6 4.1M19.1 3.4L18.4 4.1M2.5 10.5H3.5M20.5 10.5H21.5"
            class="text-yellow"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
        <h2 class="text-h2 text-navy">왜 이런 성향이 나왔을까요?</h2>
      </div>

      <div class="border-t border-line-soft" />

      <div class="flex flex-col gap-4">
        <p class="text-body font-bold text-pink tracking-tight">{{ title }}</p>

        <p class="text-body text-ink tracking-tight">
          <span>{{ normalizedPrefix }}</span>{{ " " }}<strong class="font-bold">{{ highlight }}</strong
          >{{ suffix }}
        </p>

        <div class="w-full border-t border-dashed border-line-soft" />

        <p class="text-body text-ink tracking-tight">{{ summary }}</p>
      </div>
    </div>
  </BaseCard>
</template>
