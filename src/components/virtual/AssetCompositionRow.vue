<script setup>
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
    validator: (v) => ["ink", "blue", "green", "lavender"].includes(v),
  },
});

const BAR_COLOR_CLASSES = {
  ink: "bg-ink",
  blue: "bg-blue",
  green: "bg-green",
  lavender: "bg-lavender",
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-baseline justify-between gap-4">
      <dt class="text-body text-ink">{{ props.label }}</dt>
      <dd class="text-body font-semibold text-ink tabular-nums">{{ formatCurrency(props.amount) }}</dd>
    </div>
    <div class="flex items-center gap-4">
      <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-segment">
        <div
          :class="[BAR_COLOR_CLASSES[props.barColor], 'h-full rounded-full']"
          :style="{ width: `${Math.min(100, Math.max(0, props.ratio))}%` }"
        ></div>
      </div>
      <span class="w-10 shrink-0 text-right text-caption text-muted tabular-nums">{{ props.ratio.toFixed(1) }}%</span>
    </div>
  </div>
</template>
