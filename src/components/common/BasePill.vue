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
  fullWidth: Boolean,
  wrap: Boolean,
  disabled: Boolean,
})

const VARIANT_MAP = {
  filled: {
    pink: 'bg-pink-soft text-pink font-semibold',
    blue: 'bg-blue-soft text-blue font-semibold',
    green: 'bg-green-soft text-green font-semibold',
    yellow: 'bg-yellow-soft text-yellow font-semibold',
    lavender: 'bg-lavender-soft text-lavender font-semibold',
  },
  outline: {
    pink: 'border border-pink text-pink font-semibold',
    blue: 'border border-blue text-blue font-semibold',
    green: 'border border-green text-green font-semibold',
    yellow: 'border border-yellow text-yellow font-semibold',
    lavender: 'border border-lavender text-lavender font-semibold',
  },
  ghost: {
    pink: 'bg-surface text-muted font-normal',
    blue: 'bg-surface text-muted font-normal',
    green: 'bg-surface text-muted font-normal',
    yellow: 'bg-surface text-muted font-normal',
    lavender: 'bg-surface text-muted font-normal',
  },
}

const colorClasses = computed(() => {
  const variantColors = VARIANT_MAP[props.variant] ?? VARIANT_MAP.filled
  return variantColors[props.color] ?? variantColors.pink
})

const layoutClasses = computed(() =>
  props.fullWidth ? 'w-full justify-center' : 'shrink-0',
)

const whitespaceClass = computed(() =>
  props.wrap ? 'whitespace-normal' : 'whitespace-nowrap',
)
</script>

<template>
  <component
    :is="as"
    :disabled="as === 'button' ? disabled : undefined"
    :class="[
      'inline-flex items-center rounded-full py-pill-y px-pill-x text-caption tracking-tight disabled:cursor-not-allowed disabled:opacity-50',
      layoutClasses,
      whitespaceClass,
      colorClasses,
    ]"
  >
    {{ label }}
  </component>
</template>

<style scoped></style>
