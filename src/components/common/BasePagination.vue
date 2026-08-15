<script setup>
import { computed } from "vue";

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  visiblePageCount: { type: Number, default: 4 },
});

const emit = defineEmits(["update:currentPage"]);

const pageGroupStart = computed(
  () =>
    Math.floor((props.currentPage - 1) / props.visiblePageCount) *
      props.visiblePageCount +
    1,
);
const hasPreviousPageGroup = computed(() => pageGroupStart.value > 1);
const hasNextPageGroup = computed(
  () => pageGroupStart.value + props.visiblePageCount <= props.totalPages,
);
const visiblePageNumbers = computed(() => {
  const pageCount = Math.min(
    props.totalPages - pageGroupStart.value + 1,
    props.visiblePageCount,
  );
  return Array.from(
    { length: pageCount },
    (_, index) => pageGroupStart.value + index,
  );
});

function handlePreviousPageGroup() {
  if (!hasPreviousPageGroup.value) return;
  emit("update:currentPage", Math.max(pageGroupStart.value - props.visiblePageCount, 1));
}

function handleNextPageGroup() {
  if (!hasNextPageGroup.value) return;
  emit("update:currentPage", pageGroupStart.value + props.visiblePageCount);
}

function handleSelectPage(page) {
  if (page >= 1 && page <= props.totalPages) {
    emit("update:currentPage", page);
  }
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex items-center justify-center gap-2"
    aria-label="상품 목록 페이지"
  >
    <button
      type="button"
      class="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-muted disabled:opacity-50"
      aria-label="이전 페이지 묶음"
      :disabled="!hasPreviousPageGroup"
      @click="handlePreviousPageGroup"
    >
      <svg
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          d="m14 6-6 6 6 6"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <button
      v-for="page in visiblePageNumbers"
      :key="page"
      type="button"
      :class="[
        currentPage === page ? 'bg-pink text-white' : 'bg-white text-muted',
        'flex h-10 w-10 items-center justify-center rounded-full text-button tabular-nums',
      ]"
      :aria-label="`${page}페이지`"
      :aria-current="currentPage === page ? 'page' : undefined"
      @click="handleSelectPage(page)"
    >
      {{ page }}
    </button>

    <button
      type="button"
      class="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-muted disabled:opacity-50"
      aria-label="다음 페이지 묶음"
      :disabled="!hasNextPageGroup"
      @click="handleNextPageGroup"
    >
      <svg
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          d="m10 6 6 6-6 6"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </nav>
</template>
