<script setup>
const props = defineProps({
  color: {
    type: String,
    default: "page",
    validator: (value) => ["page", "page-warm", "base", "white"].includes(value),
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

const colorClasses = {
  page: "bg-page",
  "page-warm": "bg-page-warm",
  base: "bg-base",
  white: "bg-white",
};
</script>

<template>
  <main
    :class="[
      colorClasses[props.color],
      compact ? '' : 'min-h-screen',
      compact ? 'pb-5' : 'pb-20',
      'mx-auto flex w-full max-w-[430px] flex-col px-5',
    ]"
  >
    <slot />
  </main>
</template>
