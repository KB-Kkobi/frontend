<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PERIOD_OPTIONS } from '@/constants/transaction'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const isOpen = ref(false)

const selectedLabel = computed(
  () => PERIOD_OPTIONS.find((o) => o.key === props.modelValue)?.label ?? ''
)

function handleToggle() {
  isOpen.value = !isOpen.value
}

function handleSelect(key) {
  emit('update:modelValue', key)
  isOpen.value = false
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
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="shrink-0 whitespace-nowrap text-muted">기간</span>
      <span class="min-w-0 truncate font-semibold text-ink">{{ selectedLabel }}</span>
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
        v-for="option in PERIOD_OPTIONS"
        :key="option.key"
        type="button"
        :class="[
          'w-full px-4 py-3 text-left text-body tracking-tight',
          modelValue === option.key ? 'font-semibold text-ink' : 'font-normal text-muted',
        ]"
        @click="handleSelect(option.key)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<style scoped></style>
