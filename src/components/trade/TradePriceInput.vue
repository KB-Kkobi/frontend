<script setup>
import { computed } from 'vue'
import { formatCurrencyInput, parseCurrencyInput } from '@/utils/format.js'

const props = defineProps({
  method: {
    type: String,
    required: true,
    validator: (v) => ['market', 'limit'].includes(v),
  },
  marketPrice: {
    type: Number,
    default: null,
  },
  modelValue: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const isMarket = computed(() => props.method === 'market')

const displayValue = computed(() => {
  if (isMarket.value) {
    if (props.marketPrice === null) return '--'
    return props.marketPrice.toLocaleString('ko-KR')
  }
  if (props.modelValue === null) return ''
  return props.modelValue.toLocaleString('ko-KR')
})

function handleInput(event) {
  const parsed = parseCurrencyInput(event.target.value)
  emit('update:modelValue', parsed)
  // 커서가 끝으로 이동하지 않도록 formatted 값으로 input 업데이트
  event.target.value = parsed !== null ? parsed.toLocaleString('ko-KR') : ''
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-body font-semibold text-ink">1주당 가격</span>
    <div
      :class="[
        'flex items-center gap-2 rounded-2xl border border-line px-4 py-3',
        isMarket ? 'bg-surface' : 'bg-base focus-within:border-pink',
      ]"
    >
      <span
        :class="[
          'flex-1 min-w-0 text-body tabular-nums',
          isMarket ? 'text-muted' : 'text-ink',
        ]"
      >
        <span v-if="isMarket">{{ displayValue }}</span>
        <input
          v-else
          :value="displayValue"
          type="text"
          inputmode="numeric"
          placeholder="직접 입력"
          class="w-full bg-transparent text-body text-ink outline-none placeholder:text-muted"
          @input="handleInput"
        />
      </span>
      <span class="shrink-0 text-body text-muted">원</span>
    </div>
    <p v-if="isMarket" class="text-caption text-muted tracking-tight">
      시장가는 현재가로 바로 체결돼요
    </p>
  </div>
</template>
