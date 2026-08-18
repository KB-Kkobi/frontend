<script setup>
import { watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.modelValue) close()
}

watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  },
)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// 드래그 닫기 — 핸들바 영역에서만
let dragStartY = 0

function startDrag(e) {
  dragStartY = e.touches ? e.touches[0].clientY : e.clientY
}

function endDrag(e) {
  const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY
  if (endY - dragStartY > 80) close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-dim">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 bg-black/40"
        aria-hidden="true"
        @click="close"
      />
    </Transition>

    <Transition name="sheet-panel">
      <section
        v-if="modelValue"
        class="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 flex-col overflow-hidden rounded-t-3xl border-t border-line bg-white"
        style="max-height: 90dvh"
        role="dialog"
        aria-modal="true"
      >
        <!-- 드래그 핸들 -->
        <div
          class="flex-none cursor-grab py-3 active:cursor-grabbing"
          @touchstart.passive="startDrag"
          @touchend="endDrag"
          @mousedown="startDrag"
          @mouseup="endDrag"
        >
          <div class="mx-auto h-1 w-10 rounded-full bg-line" />
        </div>

        <!-- 스크롤 가능 내용 영역 -->
        <div class="flex-1 overflow-y-auto px-5 pb-4">
          <slot />
        </div>
      </section>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-dim-enter-active,
.sheet-dim-leave-active {
  transition: opacity 250ms ease;
}
.sheet-dim-enter-from,
.sheet-dim-leave-to {
  opacity: 0;
}

.sheet-panel-enter-active,
.sheet-panel-leave-active {
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-panel-enter-from,
.sheet-panel-leave-to {
  transform: translateY(100%);
}
</style>
