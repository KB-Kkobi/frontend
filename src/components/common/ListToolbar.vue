<script setup>
const props = defineProps({
  sortLabel: { type: String, default: '정렬' },
  filterLabel: { type: String, default: '필터' },
  showSort: { type: Boolean, default: true },
  showFilter: { type: Boolean, default: true },
  filterActive: { type: Boolean, default: false },
  filterCount: { type: Number, default: 0 },
})

const emit = defineEmits(['sort', 'filter'])
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <!-- 왼쪽 -->
    <div class="flex min-w-0 items-center gap-2">
      <slot />
    </div>
    <!-- 오른쪽 -->
    <div class="flex shrink-0 items-center gap-2">
      <!-- sort slot: 없으면 기본 버튼 -->
      <slot name="sort">
        <button
          v-if="showSort"
          type="button"
          class="flex items-center gap-2 py-pill-y text-caption text-ink"
          @click="$emit('sort')"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M8 18V6m0 0L5 9m3-3 3 3M16 6v12m0 0 3-3m-3 3-3-3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>{{ sortLabel }}</span>
        </button>
      </slot>
      <!-- 필터 버튼 -->
      <button
        v-if="showFilter"
        type="button"
        :class="[filterActive ? 'text-pink' : 'text-ink', 'flex items-center gap-2 py-pill-y text-caption']"
        :aria-label="`${filterLabel}${filterCount ? ` ${filterCount}개 적용 중` : ''}`"
        @click="$emit('filter')"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="M4 7h7m4 0h5M4 17h3m4 0h9" stroke-width="1.8" stroke-linecap="round" />
          <circle cx="13" cy="7" r="2" stroke-width="1.8" />
          <circle cx="9" cy="17" r="2" stroke-width="1.8" />
        </svg>
        <span>{{ filterLabel }}{{ filterCount ? ` ${filterCount}` : '' }}</span>
      </button>
    </div>
  </div>
</template>
