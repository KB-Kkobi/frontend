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
        "pink-soft",
        "blue-soft",
        "yellow-soft",
      ].includes(v),
  },
});

const COLOR_CLASSES = {
  pink: "bg-pink text-white",
  blue: "bg-blue text-white",
  green: "bg-green text-white",
  yellow: "bg-yellow text-ink",
  "pink-soft": "bg-pink-soft text-pink",
  "blue-soft": "bg-blue-soft text-blue",
  "yellow-soft": "bg-yellow-soft text-yellow",
};
</script>

<template>
  <span :class="[COLOR_CLASSES[color], 'rounded-full px-2 py-1 text-caption']">
    <slot />
  </span>
</template>