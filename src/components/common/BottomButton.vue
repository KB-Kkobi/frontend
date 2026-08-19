<script setup>
defineProps({
  color: {
    type: String,
    default: "pink",
    validator: (v) => ["pink", "blue", "green", "yellow", "white", "danger"].includes(v),
  },
  shape: {
    type: String,
    default: "rounded",
    validator: (v) => ["rounded", "pill"].includes(v),
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
  white: "border border-line bg-white text-ink",
  danger: "border border-line bg-white text-error",
};

const SHAPE_CLASSES = {
  rounded: "rounded-2xl",
  pill: "rounded-full",
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      COLOR_CLASSES[color],
      SHAPE_CLASSES[shape],
      'w-full touch-manipulation px-4 py-3 text-button transition-transform duration-150 enabled:active:scale-95 enabled:active:opacity-90 disabled:opacity-50',
    ]"
  >
    <slot />
  </button>
</template>
