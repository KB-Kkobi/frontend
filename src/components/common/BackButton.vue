<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()

function handleClick() {
  if (props.disabled) return
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <button
    type="button"
    class="p-2 text-ink disabled:opacity-50"
    aria-label="뒤로가기"
    :disabled="disabled"
    @click="handleClick"
  >
    <svg
      class="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15 18L9.31461 12.7071C8.89513 12.3166 8.89513 11.6834 9.31461 11.2929L15 6"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>
  </button>
</template>
