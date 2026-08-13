<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <header class="flex flex-col items-center gap-2 text-center">
    <slot>
      <h1 class="text-h1 text-ink">{{ title }}</h1>
      <p v-if="description" class="text-caption text-muted tracking-tight">
        {{ description }}
      </p>
    </slot>
  </header>
</template>
