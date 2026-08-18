<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    class="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70"
    :class="modelValue ? 'bg-pink' : 'bg-line'"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span
      class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform duration-200"
      :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
    />
  </button>
</template>
