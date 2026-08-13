<script setup>
import BaseCard from "@/components/common/BaseCard.vue";

defineProps({
  strength: {
    type: String,
    default: "",
  },
  caution: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <BaseCard color="blue">
      <div class="flex flex-col gap-2">
        <h2 class="flex items-center gap-2 text-h2 text-navy">
          <svg
            class="h-6 w-6 shrink-0 text-blue"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M13.5 2L4 13.5H11L10 22L20 10H13L13.5 2Z"
              fill="currentColor"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          강점
        </h2>
        <p class="text-body text-ink">{{ strength }}</p>
      </div>
    </BaseCard>

    <BaseCard color="yellow">
      <div class="flex flex-col gap-2">
        <h2 class="flex items-center gap-2 text-h2 text-navy">
          <svg
            class="h-6 w-6 shrink-0 text-yellow"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 3L22 20H2L12 3Z"
              fill="currentColor"
              stroke="currentColor"
              stroke-linejoin="round"
            />
            <path
              d="M12 9V14"
              class="text-white"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle class="text-white" cx="12" cy="17" r="1" fill="currentColor" />
          </svg>
          주의점
        </h2>
        <p class="text-body text-ink">{{ caution }}</p>
      </div>
    </BaseCard>
  </div>
</template>
