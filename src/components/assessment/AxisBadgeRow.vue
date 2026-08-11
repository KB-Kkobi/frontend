<script setup>
import BasePill from "@/components/common/BasePill.vue";

defineProps({
  badges: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <div class="flex gap-2">
    <BasePill v-for="badge in badges" :key="badge.key" :label="badge.label" color="lavender" />
  </div>
</template>