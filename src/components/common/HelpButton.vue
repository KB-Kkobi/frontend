<script setup>
defineProps({
  ariaLabel: { type: String, required: true },
  size: { type: Number, default: 20 },
});

defineEmits(["click"]);
</script>

<template>
  <button
    type="button"
    :style="{ width: `${size}px`, height: `${size}px` }"
    class="relative flex items-center justify-center rounded-full border border-line text-caption text-muted before:absolute before:h-11 before:w-11 before:content-[''] before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2"
    :aria-label="ariaLabel"
    @click="$emit('click')"
  >
    ?
  </button>
</template>
