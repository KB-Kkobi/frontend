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
  <header v-if="$slots.actions" class="grid grid-cols-[40px_1fr_40px] items-start gap-2">
    <div class="h-10" aria-hidden="true" />
    <div class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <div class="flex h-10 items-center justify-center">
        <slot name="title">
          <h1 class="text-h1 text-ink">{{ title }}</h1>
        </slot>
      </div>
      <slot name="description">
        <p v-if="description" class="text-caption text-muted tracking-tight">
          {{ description }}
        </p>
      </slot>
    </div>
    <div class="flex h-10 items-center justify-end">
      <slot name="actions" />
    </div>
  </header>
  <header v-else class="flex flex-col items-center gap-2 text-center">
    <slot>
      <h1 class="text-h1 text-ink">{{ title }}</h1>
      <p v-if="description" class="text-caption text-muted tracking-tight">
        {{ description }}
      </p>
    </slot>
  </header>
</template>
