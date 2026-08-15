<script setup>
import BottomButton from "@/components/common/BottomButton.vue";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  message: { type: String, required: true },
  confirmText: { type: String, default: "확인" },
  cancelText: { type: String, default: "취소" },
  confirmColor: {
    type: String,
    default: "pink",
    validator: (v) =>
      ["pink", "blue", "green", "yellow", "white"].includes(v),
  },
  showCancel: { type: Boolean, default: true },
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
  if (props.showCancel) {
    handleCancel();
  } else {
    close();
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
      @click.self="handleBackdropClick"
    >
      <div
        class="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white pt-8 px-4 pb-4 shadow-popup"
      >
        <p class="text-h2 text-ink text-center tracking-tight">
          {{ message }}
        </p>
        <slot name="content" />
        <div class="flex gap-2">
          <BottomButton v-if="showCancel" color="white" @click="handleCancel">
            {{ cancelText }}
          </BottomButton>
          <BottomButton :color="confirmColor" @click="handleConfirm">
            {{ confirmText }}
          </BottomButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
