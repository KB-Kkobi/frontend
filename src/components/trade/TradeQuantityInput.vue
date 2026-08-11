<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  maxQuantity: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const QUICK_OPTIONS = [
  { label: '1주', value: 1 },
  { label: '5주', value: 5 },
  { label: '10주', value: 10 },
  { label: '최대', value: null }, // null = maxQuantity
]

const selectedQuick = computed(() => {
  if (props.modelValue === props.maxQuantity) return '최대'
  const matched = QUICK_OPTIONS.find(
    (opt) => opt.value !== null && opt.value === props.modelValue,
  )
  return matched ? matched.label : null
})

function clamp(value) {
  return Math.min(Math.max(value, 0), props.maxQuantity)
}

function handleDecrement() {
  emit('update:modelValue', clamp(props.modelValue - 1))
}

function handleIncrement() {
  emit('update:modelValue', clamp(props.modelValue + 1))
}

function handleQuickSelect(opt) {
  const value = opt.value === null ? props.maxQuantity : opt.value
  emit('update:modelValue', clamp(value))
}

function isQuickSelected(opt) {
  if (opt.label === '최대') return selectedQuick.value === '최대'
  return selectedQuick.value === opt.label
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-body font-semibold text-ink">수량</span>

    <!-- 스텝퍼 -->
    <div class="flex items-center rounded-2xl border border-pink">
      <button
        type="button"
        class="flex h-12 w-12 shrink-0 items-center justify-center text-ink active:opacity-70"
        :disabled="modelValue <= 0"
        @click="handleDecrement"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 10H16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        </svg>
      </button>

      <span class="flex-1 text-center text-body font-bold tabular-nums text-ink">
        {{ modelValue }} 주
      </span>

      <button
        type="button"
        class="flex h-12 w-12 shrink-0 items-center justify-center text-ink active:opacity-70"
        :disabled="modelValue >= maxQuantity"
        @click="handleIncrement"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <!-- 빠른 선택 pill -->
    <div class="flex gap-2">
      <button
        v-for="opt in QUICK_OPTIONS"
        :key="opt.label"
        type="button"
        :class="[
          'flex-1 rounded-full py-pill-y px-pill-x text-caption text-center transition-colors',
          isQuickSelected(opt)
            ? 'bg-yellow text-ink font-semibold'
            : 'bg-surface text-muted font-normal',
        ]"
        @click="handleQuickSelect(opt)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>
