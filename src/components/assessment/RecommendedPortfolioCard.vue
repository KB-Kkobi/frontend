<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import PortfolioDonutChart from "@/components/assessment/PortfolioDonutChart.vue";
import { PORTFOLIO_SEGMENT_DEFINITIONS } from "@/constants/assessment";

const props = defineProps({
  personaName: {
    type: String,
    required: true,
  },
  stockRatio: {
    type: Number,
    required: true,
  },
  bondRatio: {
    type: Number,
    required: true,
  },
  depositRatio: {
    type: Number,
    required: true,
  },
});

const DOT_COLOR_CLASSES = {
  pink: "bg-pink",
  blue: "bg-blue",
  green: "bg-green",
  yellow: "bg-yellow",
};

const segments = computed(() =>
  PORTFOLIO_SEGMENT_DEFINITIONS.map((segment) => ({
    key: segment.key,
    label: segment.label,
    color: segment.color,
    dotClass: DOT_COLOR_CLASSES[segment.color],
    value: props[segment.key],
  })),
);
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col items-center gap-2 text-center">
        <h2 class="text-h2 text-navy">추천 포트폴리오 비율</h2>
        <p class="text-caption text-muted">{{ personaName }}에게 어울리는 배분이에요</p>
      </div>

      <div class="flex items-center gap-4">
        <div class="h-24 w-24 shrink-0">
          <PortfolioDonutChart :segments="segments" />
        </div>

        <ul class="flex flex-1 flex-col gap-2">
          <li
            v-for="segment in segments"
            :key="segment.key"
            class="flex items-center gap-2 text-body text-ink"
          >
            <span class="h-3 w-3 rounded-full" :class="segment.dotClass" aria-hidden="true" />
            <span class="flex-1">{{ segment.label }}</span>
            <span class="text-navy tabular-nums">{{ segment.value }}%</span>
          </li>
        </ul>
      </div>
    </div>
  </BaseCard>
</template>