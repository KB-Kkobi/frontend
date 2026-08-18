<script setup>
import { RouterLink } from "vue-router";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";

defineProps({
  title: {
    type: String,
    required: true,
  },
  moreTo: {
    type: [String, Object],
    required: true,
  },
  moreLabel: {
    type: String,
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
  emptyActionLabel: {
    type: String,
    default: "상품 보기",
  },
  showMore: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["select-item", "empty-action"]);
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <h2 class="min-w-0 text-h2 text-ink">{{ title }}</h2>
      <RouterLink
        v-if="showMore && items.length"
        :to="moreTo"
        class="flex shrink-0 items-center gap-2 whitespace-nowrap py-3 text-caption font-semibold text-pink"
      >
        {{ moreLabel }}
        <span aria-hidden="true">›</span>
      </RouterLink>
    </div>

    <BaseCard v-if="!items.length" color="white" elevation="flat">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <p class="text-h2 text-ink tracking-tight">{{ emptyTitle }}</p>
          <p class="text-caption text-muted tracking-tight">{{ emptyDescription }}</p>
        </div>
        <BottomButton color="pink" @click="$emit('empty-action')">
          {{ emptyActionLabel }}
        </BottomButton>
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
