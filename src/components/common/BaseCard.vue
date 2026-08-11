<script setup>
defineProps({
  color: {
    type: String,
    default: "white",
    validator: (v) =>
      ["white", "pink", "blue", "green", "yellow", "lavender", "cream"].includes(v),
  },
});

const COLOR_CLASSES = {
  white: "bg-base border-line-soft shadow-card",
  pink: "bg-pink-soft",
  blue: "bg-blue-soft",
  green: "bg-green-soft",
  yellow: "bg-yellow-soft",
  lavender: "bg-lavender-soft",
  cream: "bg-cream-soft",
};
</script>

<template>
  <section :class="[COLOR_CLASSES[color], 'rounded-3xl p-4']">
    <slot />
  </section>
</template>
