<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { STOCK_TYPE_OPTIONS } from '@/constants/transaction'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const isOpen = ref(false)

const summaryLabel = computed(() => {
  const count = props.modelValue.length
  if (count === 0) return '전체'
  if (count === 1) return STOCK_TYPE_OPTIONS.find((o) => o.key === props.modelValue[0])?.label ?? ''
  return `${count}개`
})

function handleToggle() {
  isOpen.value = !isOpen.value
}

function handleSelect(key) {
  const isSelected = props.modelValue.includes(key)
  const next = isSelected
    ? props.modelValue.filter((k) => k !== key)
    : [...props.modelValue, key]
  emit('update:modelValue', next)
}

function handleOutsideClick(e) {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onUnmounted(() => document.removeEventListener('click', handleOutsideClick))
</script>

<template>
  <div ref="containerRef" class="relative">
    <button
      type="button"
      class="flex w-full items-center gap-2 overflow-hidden rounded-full border border-line bg-white px-4 py-3 text-body tracking-tight"
      @click="handleToggle"
    >
      <svg
        class="h-4 w-4 shrink-0 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M4 6H20M7 12H17M10 18H14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="shrink-0 whitespace-nowrap text-muted">종류</span>
      <span class="min-w-0 truncate font-semibold text-ink">{{ summaryLabel }}</span>
      <svg
        :class="['h-4 w-4 shrink-0 text-muted transition-transform duration-200', isOpen && 'rotate-180']"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="absolute left-0 top-full z-10 mt-2 min-w-full overflow-hidden rounded-2xl border border-line bg-white"
    >
      <button
        v-for="option in STOCK_TYPE_OPTIONS"
        :key="option.key"
        type="button"
        :class="[
          'flex w-full items-center justify-between px-4 py-3 text-left text-body tracking-tight',
          modelValue.includes(option.key) ? 'font-semibold text-ink' : 'font-normal text-muted',
        ]"
        @click="handleSelect(option.key)"
      >
        {{ option.label }}
        <svg
          v-if="modelValue.includes(option.key)"
          class="h-4 w-4 shrink-0 text-blue"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M5 12L10 17L19 7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped></style>
