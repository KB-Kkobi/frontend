<script setup>
defineProps({
  color: {
    type: String,
    default: "yellow",
    validator: (v) =>
      [
        "pink",
        "blue",
        "green",
        "yellow",
        "error",
        "pink-soft",
        "blue-soft",
        "yellow-soft",
        "error-soft",
      ].includes(v),
  },
});

const COLOR_CLASSES = {
  pink: "bg-pink text-white",
  blue: "bg-blue text-white",
  green: "bg-green text-white",
  yellow: "bg-yellow text-ink",
  error: "bg-error text-white",
  "pink-soft": "bg-pink-soft text-pink",
  "blue-soft": "bg-blue-soft text-blue",
  "yellow-soft": "bg-yellow-soft text-yellow",
  "error-soft": "bg-error/10 text-error",
};
</script>

<template>
  <span :class="[COLOR_CLASSES[color], 'rounded-full px-2 py-1 text-caption']">
    <slot />
  </span>
</template>