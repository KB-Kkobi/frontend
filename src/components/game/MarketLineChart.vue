<script setup>
import { computed } from "vue";
import {
  CHART_MARKER_RADIUS,
  CHART_PADDING,
  CHART_STROKE_WIDTH,
  CHART_VIEWBOX_HEIGHT,
  CHART_VIEWBOX_WIDTH,
} from "@/constants/game";

const props = defineProps({
  prices: {
    type: Array,
    default: () => [],
  },
  totalTicks: {
    type: Number,
    default: 0,
  },
  priceMin: {
    type: Number,
    default: 0,
  },
  priceMax: {
    type: Number,
    default: 0,
  },
});

const innerWidth = CHART_VIEWBOX_WIDTH - CHART_PADDING * 2;
const innerHeight = CHART_VIEWBOX_HEIGHT - CHART_PADDING * 2;

const points = computed(() => {
  const { prices, totalTicks, priceMin, priceMax } = props;
  if (prices.length === 0 || totalTicks <= 1) return [];

  const range = priceMax - priceMin || 1;

  return prices.map((price, index) => {
    const x = CHART_PADDING + (index / (totalTicks - 1)) * innerWidth;
    const y =
      CHART_PADDING + innerHeight - ((price - priceMin) / range) * innerHeight;
    return { x, y };
  });
});

const polylinePoints = computed(() =>
  points.value.map(({ x, y }) => `${x},${y}`).join(" "),
);

const lastPoint = computed(() => points.value[points.value.length - 1] ?? null);
</script>

<template>
  <svg
    class="h-40 w-full"
    :viewBox="`0 0 ${CHART_VIEWBOX_WIDTH} ${CHART_VIEWBOX_HEIGHT}`"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline
      :points="polylinePoints"
      fill="none"
      stroke="currentColor"
      :stroke-width="CHART_STROKE_WIDTH"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
    <circle
      v-if="lastPoint"
      :cx="lastPoint.x"
      :cy="lastPoint.y"
      :r="CHART_MARKER_RADIUS"
      fill="currentColor"
    />
  </svg>
</template>