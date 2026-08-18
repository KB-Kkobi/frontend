<script setup>
import BottomButton from "@/components/common/BottomButton.vue";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  message: { type: String, required: true },
  confirmText: { type: String, default: "확인" },
  cancelText: { type: String, default: "취소" },
  cancelColor: {
    type: String,
    default: "white",
    validator: (v) =>
      ["pink", "blue", "green", "yellow", "white"].includes(v),
  },
  confirmColor: {
    type: String,
    default: "pink",
    validator: (v) =>
      ["pink", "blue", "green", "yellow", "white"].includes(v),
  },
  showCancel: { type: Boolean, default: true },
  cancelDisabled: { type: Boolean, default: false },
  tone: {
    type: String,
    default: "default",
    validator: (v) =>
      ["default", "neutral", "tutorial-confirm", "tutorial-skip"].includes(v),
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

function close() {
  emit("update:modelValue", false);
}

function handleConfirm() {
  emit("confirm");
  close();
}

function handleCancel() {
  emit("cancel");
  close();
}

function handleBackdropClick() {
  if (props.cancelDisabled) return;
  if (props.showCancel) {
    handleCancel();
  } else {
    close();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      :enter-active-class="tone === 'tutorial-skip' ? 'transition duration-150 ease-out' : ''"
      :enter-from-class="tone === 'tutorial-skip' ? 'opacity-0' : ''"
      :leave-active-class="tone === 'tutorial-skip' ? 'transition duration-150 ease-in' : ''"
      :leave-to-class="tone === 'tutorial-skip' ? 'opacity-0' : ''"
    >
      <div
        v-if="modelValue"
        :class="[
          'fixed inset-0 flex items-center justify-center px-5',
          tone === 'tutorial-skip' ? 'z-[70] bg-transparent' : 'z-50',
          tone === 'tutorial-confirm' ? 'bg-black/15' : tone === 'tutorial-skip' ? '' : 'bg-black/40',
        ]"
        @click.self="handleBackdropClick"
      >
        <div
          :class="[
            'flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white pt-8 px-4 pb-4',
            tone === 'default' ? 'shadow-popup' : 'shadow-float',
          ]"
        >
          <slot name="visual" />
          <p class="text-h2 text-ink text-center tracking-tight">
            {{ message }}
          </p>
          <slot name="content" />
          <div class="flex gap-2">
            <BottomButton
              v-if="showCancel"
              :color="cancelColor"
              :disabled="cancelDisabled"
              @click="handleCancel"
            >
              {{ cancelText }}
            </BottomButton>
            <BottomButton :color="confirmColor" @click="handleConfirm">
              {{ confirmText }}
            </BottomButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
