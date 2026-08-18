<script setup>
import { ref, watch } from 'vue'
import BaseBottomSheet from '@/components/common/BaseBottomSheet.vue'
import BasePill from '@/components/common/BasePill.vue'
import BottomButton from '@/components/common/BottomButton.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  title: { type: String, default: '필터' },
  description: { type: String, default: '여러 조건을 함께 선택할 수 있어요.' },
  groups: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:open', 'apply', 'reset'])

const draft = ref({})

function initDraft() {
  const next = {}
  props.groups.forEach((group) => {
    next[group.key] = [...(props.modelValue[group.key] ?? [])]
  })
  draft.value = next
}

function isSelected(groupKey, value) {
  return (draft.value[groupKey] ?? []).includes(value)
}

function toggleOption(groupKey, value, multiple) {
  const current = draft.value[groupKey] ?? []
  if (multiple) {
    draft.value[groupKey] = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
  } else {
    draft.value[groupKey] = current.includes(value) ? [] : [value]
  }
}

function handleReset() {
  props.groups.forEach((group) => {
    draft.value[group.key] = []
  })
  emit('reset')
}

function handleClose() {
  emit('update:open', false)
}

function handleApply() {
  const result = {}
  props.groups.forEach((group) => {
    result[group.key] = [...(draft.value[group.key] ?? [])]
  })
  emit('apply', result)
  emit('update:open', false)
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) initDraft()
  },
)
</script>

<template>
  <BaseBottomSheet :model-value="open" @update:model-value="emit('update:open', $event)">
    <div class="flex flex-col gap-6 py-2">
      <!-- 헤더 -->
      <header class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-2">
          <h2 id="filter-sheet-title" class="text-h1 text-ink">{{ title }}</h2>
          <p v-if="description" class="text-caption text-muted">{{ description }}</p>
        </div>
        <button
          type="button"
          class="text-h1 text-muted"
          :aria-label="`${title} 닫기`"
          @click="handleClose"
        >
          ×
        </button>
      </header>

      <!-- 필터 그룹 반복 -->
      <fieldset v-for="group in groups" :key="group.key" class="flex flex-col gap-4">
        <legend class="text-h2 text-ink">{{ group.label }}</legend>
        <div class="grid gap-2" :class="`grid-cols-${group.cols ?? 2}`">
          <BasePill
            v-for="option in group.options"
            :key="option.value"
            as="button"
            type="button"
            :label="option.label"
            :color="group.color ?? 'pink'"
            full-width
            :variant="isSelected(group.key, option.value) ? 'filled' : 'ghost'"
            :aria-pressed="isSelected(group.key, option.value)"
            @click="toggleOption(group.key, option.value, group.multiple ?? true)"
          />
        </div>
      </fieldset>

      <!-- 하단 버튼 -->
      <div class="flex gap-2">
        <BottomButton color="white" @click="handleReset">초기화</BottomButton>
        <BottomButton @click="handleApply">적용</BottomButton>
      </div>
    </div>
  </BaseBottomSheet>
</template>

