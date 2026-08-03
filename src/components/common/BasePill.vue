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
})

const COLOR_MAP = {
  pink: 'bg-pink-soft text-pink',
  blue: 'bg-blue-soft text-blue',
  green: 'bg-green-soft text-green',
  yellow: 'bg-yellow-soft text-yellow',
}

const colorClasses = computed(() => COLOR_MAP[props.color] ?? COLOR_MAP.pink)
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full py-pill-y px-pill-x text-caption font-semibold tracking-tight',
      colorClasses,
    ]"
  >
    {{ label }}
  </span>
</template>

<style scoped></style>
