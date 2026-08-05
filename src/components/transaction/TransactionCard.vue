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
  <BaseCard color="white">
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-start">
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <span class="text-h2 text-ink tracking-tight">{{ name }}</span>
            <BasePill v-if="pill" :label="pill.label" :color="pill.color" />
          </div>
          <span v-if="subLabel" class="text-caption text-muted tracking-tight">{{ subLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="datetime" class="text-caption text-muted tracking-tight">{{ datetime }}</span>
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
      <div class="border-t border-line-soft" />
      <div class="flex gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="flex flex-col gap-2 flex-1"
        >
          <span class="text-caption text-muted tracking-tight">{{ stat.label }}</span>
          <span class="text-body font-semibold tabular-nums tracking-tight">{{ stat.value }}</span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped></style>
