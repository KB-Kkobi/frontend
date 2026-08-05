<script setup>
import { computed } from 'vue'
import { SORT_OPTIONS } from '@/constants/transaction'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const currentLabel = computed(
  () => SORT_OPTIONS.find((o) => o.key === props.modelValue)?.label ?? ''
)

function handleToggle() {
  emit('update:modelValue', props.modelValue === 'desc' ? 'asc' : 'desc')
}
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-2 text-caption text-muted tracking-tight"
    @click="handleToggle"
  >
    {{ currentLabel }}
    <svg
      class="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 10L12 6L16 10"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M16 14L12 18L8 14"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<style scoped></style>
