<script setup>
defineProps({
  color: {
    type: String,
    default: "pink",
    validator: (v) => ["pink", "blue", "green", "yellow", "white"].includes(v),
  },
  type: {
    type: String,
    default: "button",
  },
  disabled: Boolean,
});

const COLOR_CLASSES = {
  pink: "bg-pink text-white",
  blue: "bg-blue text-white",
  green: "bg-green text-white",
  yellow: "bg-yellow text-ink",
  white: "bg-surface text-ink border border-line",
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      COLOR_CLASSES[color],
      'w-full rounded-2xl px-4 py-5 text-button active:opacity-90 disabled:opacity-50',
    ]"
  >
    <slot />
  </button>
</template>
