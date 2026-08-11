<script setup>
import { computed } from "vue";
import {
  DONUT_CENTER,
  DONUT_RADIUS,
  DONUT_STROKE_WIDTH,
  DONUT_VIEWBOX_SIZE,
} from "@/constants/assessment";

const props = defineProps({
  segments: {
    type: Array,
    required: true,
  },
});

const COLOR_CLASSES = {
  pink: "text-pink",
  blue: "text-blue",
  green: "text-green",
  yellow: "text-yellow",
};

const circumference = 2 * Math.PI * DONUT_RADIUS;

const arcs = computed(() => {
  let offset = 0;
  return props.segments.map((segment) => {
    const length = (Math.max(segment.value, 0) / 100) * circumference;
    const arc = {
      key: segment.key,
      colorClass: COLOR_CLASSES[segment.color] ?? COLOR_CLASSES.pink,
      dasharray: `${length} ${circumference - length}`,
      dashoffset: -offset,
    };
    offset += length;
    return arc;
  });
});
</script>

<template>
  <svg
    class="h-full w-full -rotate-90"
    :viewBox="`0 0 ${DONUT_VIEWBOX_SIZE} ${DONUT_VIEWBOX_SIZE}`"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      v-for="arc in arcs"
      :key="arc.key"
      :cx="DONUT_CENTER"
      :cy="DONUT_CENTER"
      :r="DONUT_RADIUS"
      fill="none"
      :class="arc.colorClass"
      stroke="currentColor"
      :stroke-width="DONUT_STROKE_WIDTH"
      :stroke-dasharray="arc.dasharray"
      :stroke-dashoffset="arc.dashoffset"
      stroke-linecap="butt"
    />
  </svg>
</template>