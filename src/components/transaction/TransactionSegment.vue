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

const SELECTED_CLASSES = 'bg-yellow text-ink font-semibold'
const UNSELECTED_CLASSES = 'text-muted font-normal'

function handleSelect(key) {
  emit('update:modelValue', key)
}
</script>

<template>
  <div class="flex rounded-full bg-surface p-segment-p">
    <button
      v-for="segment in SEGMENTS"
      :key="segment.key"
      type="button"
      :class="[
        'flex-1 rounded-full py-pill-y px-pill-x text-body tracking-tight text-center',
        modelValue === segment.key ? SELECTED_CLASSES : UNSELECTED_CLASSES,
      ]"
      @click="handleSelect(segment.key)"
    >
      {{ segment.label }}
    </button>
  </div>
</template>

<style scoped></style>
