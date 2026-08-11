<script setup>
const props = defineProps({
  method: {
    type: String,
    required: true,
    validator: (v) => ['market', 'limit'].includes(v),
  },
})

const emit = defineEmits(['update:method'])

function handleSelect(value) {
  emit('update:method', value)
}
</script>

<template>
  <div class="flex rounded-2xl bg-surface p-segment-p">
    <button
      type="button"
      :class="[
        'flex-1 rounded-xl py-3 text-button transition-colors',
        props.method === 'market'
          ? 'bg-yellow text-ink font-semibold'
          : 'bg-transparent text-muted font-normal',
      ]"
      @click="handleSelect('market')"
    >
      시장가로 주문
    </button>
    <button
      type="button"
      :class="[
        'flex-1 rounded-xl py-3 text-button transition-colors',
        props.method === 'limit'
          ? 'bg-yellow text-ink font-semibold'
          : 'bg-transparent text-muted font-normal',
      ]"
      @click="handleSelect('limit')"
    >
      지정가로 주문
    </button>
  </div>
</template>
