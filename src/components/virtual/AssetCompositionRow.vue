<script setup>
import { computed } from "vue";
import { formatCurrency } from "@/utils/format";

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    default: null,
  },
  ratio: {
    type: Number,
    required: true,
  },
  barColor: {
    type: String,
    default: "ink",
    validator: (v) => ["ink", "pink", "blue", "green", "lavender"].includes(v),
  },
});

const BAR_COLOR_CLASSES = {
  ink: "bg-ink",
  pink: "bg-pink",
  blue: "bg-blue",
  green: "bg-green",
  lavender: "bg-lavender",
};

const normalizedRatio = computed(() => {
  const ratio = Number(props.ratio);
  if (!Number.isFinite(ratio)) return 0;
  return Math.min(100, Math.max(0, ratio));
});

const ratioLabel = computed(() => {
  const ratio = normalizedRatio.value;
  return `${Number.isInteger(ratio) ? ratio.toFixed(0) : ratio.toFixed(1)}%`;
});
</script>

<template>
  <div class="flex items-baseline justify-between gap-4">
    <dt class="flex items-center gap-2 text-body text-ink">
      <span
        :class="[BAR_COLOR_CLASSES[props.barColor], 'h-2 w-2 shrink-0 rounded-full']"
        aria-hidden="true"
      ></span>
      <span>{{ props.label }}</span>
      <span class="text-caption text-muted tabular-nums">{{ ratioLabel }}</span>
    </dt>
    <dd class="text-body font-semibold text-ink tabular-nums">
      {{ formatCurrency(props.amount) }}
    </dd>
  </div>
</template>
