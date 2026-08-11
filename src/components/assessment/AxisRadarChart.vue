<script setup>
import { computed } from "vue";
import {
  RADAR_AXIS_ANGLES_DEG,
  RADAR_CENTER,
  RADAR_GRID_STEPS,
  RADAR_LABEL_FONT_SIZE,
  RADAR_LABEL_OFFSET,
  RADAR_MAX_SCORE,
  RADAR_RADIUS,
  RADAR_VIEWBOX_SIZE,
} from "@/constants/assessment";

const props = defineProps({
  axes: {
    type: Array,
    required: true,
  },
});

function toPoint(angleDeg, radius) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: RADAR_CENTER + radius * Math.cos(angleRad),
    y: RADAR_CENTER + radius * Math.sin(angleRad),
  };
}

function toPolygonAttr(points) {
  return points.map(({ x, y }) => `${x},${y}`).join(" ");
}

const gridPolygons = computed(() =>
  RADAR_GRID_STEPS.map((step) =>
    toPolygonAttr(
      RADAR_AXIS_ANGLES_DEG.map((angleDeg) => toPoint(angleDeg, RADAR_RADIUS * step)),
    ),
  ),
);

const axisLines = computed(() =>
  RADAR_AXIS_ANGLES_DEG.map((angleDeg) => toPoint(angleDeg, RADAR_RADIUS)),
);

const labels = computed(() =>
  props.axes.map((axis, index) => ({
    key: axis.key,
    label: axis.label,
    ...toPoint(RADAR_AXIS_ANGLES_DEG[index], RADAR_RADIUS + RADAR_LABEL_OFFSET),
  })),
);

const scorePolygon = computed(() =>
  toPolygonAttr(
    props.axes.map((axis, index) => {
      const value = Math.min(Math.max(axis.value ?? 0, 0), RADAR_MAX_SCORE);
      return toPoint(RADAR_AXIS_ANGLES_DEG[index], (RADAR_RADIUS * value) / RADAR_MAX_SCORE);
    }),
  ),
);
</script>

<template>
  <svg
    class="h-full w-full"
    :viewBox="`0 0 ${RADAR_VIEWBOX_SIZE} ${RADAR_VIEWBOX_SIZE}`"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon
      v-for="(polygon, index) in gridPolygons"
      :key="index"
      :points="polygon"
      class="text-line"
      fill="none"
      stroke="currentColor"
      stroke-width="0.5"
    />

    <line
      v-for="(point, index) in axisLines"
      :key="index"
      :x1="RADAR_CENTER"
      :y1="RADAR_CENTER"
      :x2="point.x"
      :y2="point.y"
      class="text-line"
      stroke="currentColor"
      stroke-width="0.5"
    />

    <polygon
      :points="scorePolygon"
      class="text-pink"
      fill="currentColor"
      fill-opacity="0.35"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />

    <text
      v-for="point in labels"
      :key="point.key"
      :x="point.x"
      :y="point.y"
      class="text-muted"
      fill="currentColor"
      :font-size="RADAR_LABEL_FONT_SIZE"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      {{ point.label }}
    </text>
  </svg>
</template>