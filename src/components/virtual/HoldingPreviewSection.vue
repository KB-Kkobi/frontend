<script setup>
import { RouterLink } from "vue-router";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";

defineProps({
  title: {
    type: String,
    required: true,
  },
  moreTo: {
    type: [String, Object],
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  itemKey: {
    type: Function,
    required: true,
  },
  emptyTitle: {
    type: String,
    required: true,
  },
  emptyDescription: {
    type: String,
    required: true,
  },
});

defineEmits(["select-item", "empty-action"]);
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-h2 text-ink">{{ title }}</h2>
      <RouterLink
        :to="moreTo"
        class="flex items-center gap-1 text-caption font-semibold text-pink"
      >
        더보기
        <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </RouterLink>
    </div>

    <BaseCard v-if="!items.length" color="white" elevation="flat">
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <p class="text-body text-ink tracking-tight">{{ emptyTitle }}</p>
          <p class="text-caption text-muted tracking-tight">{{ emptyDescription }}</p>
        </div>
        <BasePill
          as="button"
          label="상품 보기"
          color="pink"
          variant="outline"
          @click="$emit('empty-action')"
        />
      </div>
    </BaseCard>

    <BaseCard v-else color="white" elevation="flat">
      <ul class="flex flex-col divide-y divide-line-soft">
        <li v-for="item in items" :key="itemKey(item)" class="py-4 first:pt-0 last:pb-0">
          <div
            role="button"
            tabindex="0"
            class="cursor-pointer"
            @click="$emit('select-item', item)"
            @keydown.enter.prevent="$emit('select-item', item)"
            @keydown.space.prevent="$emit('select-item', item)"
          >
            <slot name="item" :item="item" />
          </div>
        </li>
      </ul>
    </BaseCard>
  </section>
</template>
