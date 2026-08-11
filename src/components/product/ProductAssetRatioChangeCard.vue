<script setup>
import BaseCard from "@/components/common/BaseCard.vue";

defineProps({
  currentRatio: {
    type: [Number, String],
    required: true,
  },
  afterRatio: {
    type: [Number, String],
    required: true,
  },
  recommendedRatio: {
    type: [Number, String],
    default: null,
  },
});
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-ink">해지 후 자산 비중 변화</h2>
        <p class="text-caption text-muted">현재 예금·적금 비중과 해지 후 예상 비중이에요.</p>
      </div>

      <div class="flex items-center justify-between gap-4">
        <span class="text-body text-muted tabular-nums">
          {{ Number(currentRatio).toFixed(1) }}%
        </span>
        <span class="text-h2 text-yellow" aria-hidden="true">→</span>
        <strong class="text-h2 text-yellow tabular-nums">
          {{ Number(afterRatio).toFixed(1) }}%
        </strong>
      </div>

      <div class="h-2 overflow-hidden rounded-full bg-surface">
        <div
          class="h-full rounded-full bg-yellow"
          :style="{ width: `${Math.min(100, Math.max(0, Number(afterRatio)))}%` }"
        ></div>
      </div>

      <BaseCard v-if="recommendedRatio !== null" color="yellow">
        <p class="text-caption text-ink">
          내 투자 성향의 추천 예금·적금 비중은
          <strong class="font-semibold tabular-nums">
            {{ Number(recommendedRatio).toFixed(0) }}%
          </strong>
          예요. 유지 여부를 결정할 때 참고해 주세요.
        </p>
      </BaseCard>
    </div>
  </BaseCard>
</template>
