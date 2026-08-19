<script setup>
import { computed } from "vue";
import {
  CHART_FILL_OPACITY_TOP,
  CHART_MARKER_RADIUS_PX,
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
  compact: {
    type: Boolean,
    default: false,
  },
  showBaseline: {
    type: Boolean,
    default: false,
  },
});

const gradientId = `market-line-chart-fill-${Math.random().toString(36).slice(2)}`;

const innerWidth = CHART_VIEWBOX_WIDTH - CHART_PADDING * 2;
const innerHeight = CHART_VIEWBOX_HEIGHT - CHART_PADDING * 2;
const baselineY = CHART_VIEWBOX_HEIGHT;
const centerBaselineY = CHART_PADDING + innerHeight / 2;

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

const areaPoints = computed(() => {
  if (points.value.length === 0) return "";
  const first = points.value[0];
  const last = points.value[points.value.length - 1];
  return [
    `${first.x},${baselineY}`,
    ...points.value.map(({ x, y }) => `${x},${y}`),
    `${last.x},${baselineY}`,
  ].join(" ");
});

const lastPoint = computed(() => points.value[points.value.length - 1] ?? null);
</script>

<template>
  <svg
    :class="compact ? 'h-24 w-full' : 'h-40 w-full'"
    :viewBox="`0 0 ${CHART_VIEWBOX_WIDTH} ${CHART_VIEWBOX_HEIGHT}`"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        :id="gradientId"
        gradientUnits="userSpaceOnUse"
        :x1="0"
        :y1="CHART_PADDING"
        :x2="0"
        :y2="baselineY"
      >
        <stop offset="0%" stop-color="currentColor" :stop-opacity="CHART_FILL_OPACITY_TOP" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>

    <polygon
      v-if="areaPoints"
      :points="areaPoints"
      :fill="`url(#${gradientId})`"
      stroke="none"
    />

    <line
      v-if="showBaseline"
      class="text-line"
      :x1="CHART_PADDING"
      :y1="centerBaselineY"
      :x2="CHART_PADDING + innerWidth"
      :y2="centerBaselineY"
      stroke="currentColor"
      stroke-width="1"
      stroke-dasharray="3 3"
      vector-effect="non-scaling-stroke"
    />

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
      r="0.01"
      fill="none"
      stroke="currentColor"
      :stroke-width="CHART_MARKER_RADIUS_PX * 2"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>