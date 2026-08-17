<script setup>
import BaseCard from '@/components/common/BaseCard.vue'
import BasePill from '@/components/common/BasePill.vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  subLabel: {
    type: String,
    default: '',
  },
  pill: {
    type: Object,
    default: null,
  },
  datetime: {
    type: String,
    default: '',
  },
  stats: {
    type: Array,
    default: () => [],
  },
  isCancelable: {
    type: Boolean,
    default: false,
  },
  cancelText: {
    type: String,
    default: '주문 취소',
  },
})

const emit = defineEmits(['cancel'])

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <BaseCard color="white" elevation="flat">
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-4">
        <BasePill v-if="pill" :label="pill.label" :color="pill.color" />
        <div class="flex shrink-0 items-center gap-2">
          <span v-if="datetime" class="whitespace-nowrap text-caption text-muted tabular-nums tracking-tight">
            {{ datetime }}
          </span>
          <BasePill
            v-if="isCancelable"
            as="button"
            :label="cancelText"
            color="pink"
            variant="outline"
            @click="handleCancel"
          />
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <span class="break-keep text-h2 text-ink tracking-tight">{{ name }}</span>
        <span v-if="subLabel" class="text-caption text-muted tracking-tight">{{ subLabel }}</span>
      </div>
      <div class="border-t border-line-soft" />
      <div class="flex gap-4">
        <div
          v-for="(stat, index) in stats"
          :key="stat.label"
          :class="['flex flex-1 flex-col gap-2', index === stats.length - 1 ? 'items-end text-right' : '']"
        >
          <span class="text-caption text-muted tracking-tight">{{ stat.label }}</span>
          <span class="text-body font-semibold text-ink tabular-nums tracking-tight">{{ stat.value }}</span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped></style>
