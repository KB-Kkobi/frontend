<script setup>
const props = defineProps({
  color: {
    type: String,
    default: "page",
    validator: (value) => ["page", "base", "white"].includes(value),
  },
});

const colorClasses = {
  page: "bg-page",
  base: "bg-base",
  white: "bg-white",
};
</script>

<template>
  <main
    :class="colorClasses[props.color]"
    class="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pb-20"
  >
    <slot />
  </main>
</template>
