<script setup>
import { watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  ariaLabelledby: { type: String, default: undefined },
})

const emit = defineEmits(['update:modelValue'])

let previousBodyOverflow = ''
let isBodyLocked = false

function close() {
  emit('update:modelValue', false)
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.modelValue) close()
}

function lockBodyScroll() {
  if (isBodyLocked) return
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  isBodyLocked = true
}

function unlockBodyScroll() {
  if (!isBodyLocked) return
  document.body.style.overflow = previousBodyOverflow
  isBodyLocked = false
}

function handleAfterLeave() {
  if (!props.modelValue) unlockBodyScroll()
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) lockBodyScroll()
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  unlockBodyScroll()
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

    <Transition name="sheet-panel" @after-leave="handleAfterLeave">
      <section
        v-if="modelValue"
        class="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-sheet w-full max-w-[430px] flex-col overflow-hidden rounded-t-3xl border-t border-line bg-white"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="ariaLabelledby"
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
  transition: opacity 200ms ease;
}
.sheet-dim-enter-from,
.sheet-dim-leave-to {
  opacity: 0;
}

.sheet-panel-enter-active {
  transition: transform 200ms ease-out;
}
.sheet-panel-leave-active {
  transition: transform 200ms ease-in;
}
.sheet-panel-enter-from,
.sheet-panel-leave-to {
  transform: translate3d(0, 100%, 0);
}
</style>
