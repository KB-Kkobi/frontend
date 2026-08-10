<script setup>
import { computed } from "vue";
import { formatCurrency } from "@/utils/format";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  notice: {
    type: String,
    default: "",
  },
  amount: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  step: {
    type: Number,
    required: true,
  },
  color: {
    type: String,
    required: true,
    validator: (value) => ["yellow", "blue", "pink"].includes(value),
  },
});

const emit = defineEmits(["update:amount"]);

const ratio = computed(() =>
  Math.round((props.amount / props.totalAmount) * 100),
);

const colorClasses = computed(() => ({
  yellow: "text-yellow",
  blue: "text-blue",
  pink: "text-pink",
})[props.color]);

const progressClasses = computed(() => ({
  yellow: "bg-yellow",
  blue: "bg-blue",
  pink: "bg-pink",
})[props.color]);

function handleInput(event) {
  emit("update:amount", Number(event.target.value));
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 flex-col gap-2">
        <label :for="id" class="text-h2 font-bold text-ink">{{ label }}</label>
        <p v-if="description" class="text-caption text-muted">
          {{ description }}
        </p>
        <p v-if="notice" class="text-caption text-error">
          {{ notice }}
        </p>
      </div>

      <div class="flex shrink-0 flex-col items-end gap-2">
        <strong class="text-h1 tabular-nums" :class="colorClasses">
          {{ ratio }}%
        </strong>
        <span class="text-caption font-semibold text-muted tabular-nums">
          {{ formatCurrency(amount) }}
        </span>
      </div>
    </div>

    <div class="relative flex items-center">
      <div class="absolute flex h-2 w-full overflow-hidden rounded-full bg-surface">
        <span :class="progressClasses" :style="{ width: `${ratio}%` }"></span>
      </div>
      <input
        :id="id"
        :value="amount"
        :max="totalAmount"
        :step="step"
        :class="[colorClasses, 'game-asset-slider relative w-full cursor-pointer']"
        type="range"
        min="0"
        @input="handleInput"
      />
    </div>

    <div class="flex justify-between text-caption text-muted tabular-nums">
      <span>0원</span>
      <span>{{ formatCurrency(totalAmount) }}</span>
    </div>
  </section>
</template>

<style scoped>
.game-asset-slider {
  appearance: none;
  background: transparent;
}

.game-asset-slider::-webkit-slider-runnable-track {
  height: 0.5rem;
  background: transparent;
}

.game-asset-slider::-webkit-slider-thumb {
  width: 1.5rem;
  height: 1.5rem;
  margin-top: -0.5rem;
  appearance: none;
  border: 0.125rem solid currentColor;
  border-radius: 9999px;
  background: theme("colors.white");
}

.game-asset-slider::-moz-range-track {
  height: 0.5rem;
  background: transparent;
}

.game-asset-slider::-moz-range-thumb {
  width: 1.5rem;
  height: 1.5rem;
  border: 0.125rem solid currentColor;
  border-radius: 9999px;
  background: theme("colors.white");
}
</style>
