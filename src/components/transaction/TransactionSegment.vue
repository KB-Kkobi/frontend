<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const SEGMENTS = [
  { key: 'history', label: '거래 내역' },
  { key: 'pending', label: '대기중 주문' },
]

const SELECTED_CLASSES = 'bg-pink text-white'
const UNSELECTED_CLASSES = 'text-ink'

function handleSelect(key) {
  emit('update:modelValue', key)
}
</script>

<template>
  <div class="flex rounded-3xl bg-segment p-segment-p">
    <button
      v-for="segment in SEGMENTS"
      :key="segment.key"
      type="button"
      :class="[
        'flex-1 rounded-3xl px-4 py-3 text-center text-button',
        modelValue === segment.key ? SELECTED_CLASSES : UNSELECTED_CLASSES,
      ]"
      @click="handleSelect(segment.key)"
    >
      {{ segment.label }}
    </button>
  </div>
</template>

<style scoped></style>
