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
  minQuantity: {
    type: Number,
    default: 1,
  },
})

const emit = defineEmits(['update:modelValue'])

const effectiveMin = computed(() => (props.maxQuantity === 0 ? 0 : props.minQuantity))

const QUICK_OPTIONS = [
  { label: '최소 1주', value: 1 },
  { label: '최대', value: null }, // 템플릿에서 최대 N주로 렌더링
]

function clamp(value) {
  return Math.min(Math.max(value, effectiveMin.value), props.maxQuantity)
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
  if (opt.value === null) return props.maxQuantity >= 1 && props.modelValue === props.maxQuantity
  return props.modelValue === opt.value
}

function handleInput(event) {
  const raw = event.target.value
  const digitsOnly = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  const numeric = digitsOnly === '' ? 0 : Number(digitsOnly)
  const clamped = clamp(numeric)
  const nextText = digitsOnly === '' ? '' : String(clamped)
  if (event.target.value !== nextText) {
    event.target.value = nextText
  }
  emit('update:modelValue', clamped)
}

function handleKeyDown(event) {
  if (['-', '+', '.', 'e', 'E'].includes(event.key)) {
    event.preventDefault()
  }
}

function handleBlur(event) {
  if (event.target.value === '') {
    const restored = clamp(effectiveMin.value)
    event.target.value = String(restored)
    emit('update:modelValue', restored)
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-body font-semibold text-ink">수량</span>

    <!-- 스텝퍼 (분리형, border-pink) -->
    <div class="flex gap-2">
      <button
        type="button"
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-pink text-ink active:opacity-70 disabled:opacity-50"
        :disabled="modelValue <= effectiveMin"
        @click="handleDecrement"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 10H16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        </svg>
      </button>

      <div class="flex h-12 min-w-0 flex-1 items-center justify-center gap-1 rounded-2xl border border-pink px-4">
        <input
          :value="modelValue"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          class="min-w-0 flex-1 bg-transparent text-center text-body font-bold tabular-nums text-ink outline-none"
          aria-label="수량"
          @input="handleInput"
          @keydown="handleKeyDown"
          @blur="handleBlur"
        />
        <span class="shrink-0 text-body font-bold text-ink">주</span>
      </div>

      <button
        type="button"
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-pink text-ink active:opacity-70 disabled:opacity-50"
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
        :disabled="maxQuantity < 1"
        :class="[
          'flex-1 rounded-full py-pill-y px-pill-x text-caption text-center transition-colors disabled:opacity-50',
          isQuickSelected(opt)
            ? 'bg-pink-soft text-pink font-semibold'
            : 'bg-surface text-muted font-normal',
        ]"
        @click="handleQuickSelect(opt)"
      >
        {{ opt.value === null ? `최대 ${maxQuantity}주` : opt.label }}
      </button>
    </div>
  </div>
</template>
