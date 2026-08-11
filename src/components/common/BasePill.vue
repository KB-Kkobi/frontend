<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: 'pink',
  },
  variant: {
    type: String,
    default: 'filled',
  },
  as: {
    type: String,
    default: 'span',
  },
})

const VARIANT_MAP = {
  filled: {
    pink: 'bg-pink-soft text-pink font-semibold',
    blue: 'bg-blue-soft text-blue font-semibold',
    green: 'bg-green-soft text-green font-semibold',
    yellow: 'bg-yellow-soft text-yellow font-semibold',
  },
  outline: {
    pink: 'border border-pink text-pink font-semibold',
    blue: 'border border-blue text-blue font-semibold',
    green: 'border border-green text-green font-semibold',
    yellow: 'border border-yellow text-yellow font-semibold',
  },
  ghost: {
    pink: 'bg-surface text-muted font-normal',
    blue: 'bg-surface text-muted font-normal',
    green: 'bg-surface text-muted font-normal',
    yellow: 'bg-surface text-muted font-normal',
  },
}

const colorClasses = computed(() => {
  const variantColors = VARIANT_MAP[props.variant] ?? VARIANT_MAP.filled
  return variantColors[props.color] ?? variantColors.pink
})
</script>

<template>
  <component
    :is="as"
    :class="[
      'inline-flex shrink-0 items-center whitespace-nowrap rounded-full py-pill-y px-pill-x text-caption tracking-tight',
      colorClasses,
    ]"
  >
    {{ label }}
  </component>
</template>

<style scoped></style>
