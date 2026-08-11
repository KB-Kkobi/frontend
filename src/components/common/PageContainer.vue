<script setup>
defineProps({
  background: {
    type: String,
    default: "page",
    validator: (v) => ["page", "page-warm"].includes(v),
  },
});

const BACKGROUND_CLASSES = {
  page: "bg-page",
  "page-warm": "bg-page-warm",
};
</script>

<template>
  <main
    :class="[
      BACKGROUND_CLASSES[background],
      'mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pb-20',
    ]"
  >
    <slot />
  </main>
</template>
