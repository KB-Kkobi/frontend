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
    <BaseCard color="lavender">
      <div class="flex flex-col gap-2">
        <h2 class="flex items-center gap-2 text-h2 text-lavender">
          <span aria-hidden="true">⚡</span>
          강점
        </h2>
        <p class="text-body text-ink">{{ strength }}</p>
      </div>
    </BaseCard>

    <BaseCard color="cream">
      <div class="flex flex-col gap-2">
        <h2 class="flex items-center gap-2 text-h2 text-cream">
          <span aria-hidden="true">⚠️</span>
          주의점
        </h2>
        <p class="text-body text-ink">{{ caution }}</p>
      </div>
    </BaseCard>
  </div>
</template>