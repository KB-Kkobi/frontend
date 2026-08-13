<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import AxisRadarChart from "@/components/assessment/AxisRadarChart.vue";
import { AXIS_DEFINITIONS, RADAR_AXIS_ORDER } from "@/constants/assessment";

const props = defineProps({
  scores: {
    type: Object,
    required: true,
  },
});

const orderedAxes = computed(() =>
  RADAR_AXIS_ORDER.map((key) => {
    const axis = AXIS_DEFINITIONS.find((definition) => definition.key === key);
    return {
      key,
      label: axis.label,
      value: props.scores[key],
    };
  }),
);
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col items-center gap-2 text-center">
        <h2 class="text-h2 text-navy">투자 성향 3축</h2>
        <p class="text-caption text-muted">답변과 자산 배분을 함께 계산했어요</p>
      </div>

      <div class="h-56 w-full">
        <AxisRadarChart :axes="orderedAxes" />
      </div>

      <div class="grid grid-cols-3 divide-x divide-line rounded-2xl bg-pink-soft p-4">
        <div
          v-for="axis in orderedAxes"
          :key="axis.key"
          class="flex flex-col items-center gap-2"
        >
          <span class="text-caption text-muted">{{ axis.label }}</span>
          <span class="text-h1 font-bold text-pink tabular-nums">{{ axis.value }}</span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
