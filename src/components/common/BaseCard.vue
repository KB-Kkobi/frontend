<script setup>
defineProps({
  color: {
    type: String,
    default: "white",
    validator: (v) =>
      ["white", "pink", "blue", "green", "yellow", "lavender", "cream"].includes(v),
  },
  elevation: {
    type: String,
    default: "default",
    validator: (v) => ["flat", "default", "highlight", "float"].includes(v),
  },
  density: {
    type: String,
    default: "default",
    validator: (v) => ["default", "tutorial"].includes(v),
  },
});

const COLOR_CLASSES = {
  white: "bg-white",
  pink: "bg-pink-soft",
  blue: "bg-blue-soft",
  green: "bg-green-soft",
  yellow: "bg-yellow-soft",
  lavender: "bg-lavender-soft",
  cream: "bg-cream-soft",
};

const ELEVATION_CLASSES = {
  flat: "shadow-none",
  default: "shadow-card",
  highlight: "shadow-highlight",
  float: "shadow-float",
};

const DENSITY_CLASSES = {
  default: "p-4",
  tutorial: "px-4 pt-tutorial-card-y pb-4",
};

</script>

<template>
  <section
    :class="[
      COLOR_CLASSES[color],
      color === 'white' ? ELEVATION_CLASSES[elevation] : 'shadow-none',
      color === 'white' && elevation === 'flat' ? 'border border-line-soft' : '',
      DENSITY_CLASSES[density],
      'rounded-3xl',
    ]"
  >
    <slot />
  </section>
</template>
