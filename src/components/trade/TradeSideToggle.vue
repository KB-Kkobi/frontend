<script setup>
const props = defineProps({
  side: {
    type: String,
    required: true,
    validator: (v) => ['buy', 'sell'].includes(v),
  },
})

const emit = defineEmits(['update:side'])

function handleSelect(value) {
  emit('update:side', value)
}
</script>

<template>
  <div class="flex rounded-2xl bg-surface p-segment-p">
    <button
      type="button"
      :class="[
        'flex-1 rounded-xl py-3 text-button transition-colors',
        props.side === 'buy'
          ? 'bg-pink text-white font-semibold'
          : 'bg-transparent text-muted font-normal',
      ]"
      @click="handleSelect('buy')"
    >
      매수
    </button>
    <button
      type="button"
      :class="[
        'flex-1 rounded-xl py-3 text-button transition-colors',
        props.side === 'sell'
          ? 'bg-surface text-ink font-semibold'
          : 'bg-transparent text-muted font-normal',
      ]"
      @click="handleSelect('sell')"
    >
      매도
    </button>
  </div>
</template>
