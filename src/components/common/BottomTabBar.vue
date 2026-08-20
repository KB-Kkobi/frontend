<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAssessmentStore } from '@/stores/assessment'

const route = useRoute()
const assessmentStore = useAssessmentStore()

const PRODUCT_PATH = '/products'
const VIRTUAL_PATH = '/virtual'
const LEADERBOARD_PATH = '/leaderboard'
// 성향 분석을 완료해야 의미가 있는 탭 — 완료 전에는 잠금 아이콘을 얹고 진입을 막는다.
const ASSESSMENT_LOCKED_PATHS = new Set([VIRTUAL_PATH, LEADERBOARD_PATH])

// 상품·주식 상세는 상품 탭과 가상투자 탭 양쪽에서 진입할 수 있어 경로만으로 구분되지 않는다.
// 가상투자에서 진입한 경우에만 tradable 쿼리가 붙는다 (ProductDetailView·SecurityDetailView와 동일한 기준).
const SHARED_DETAIL_ROUTES = new Set([
  'product-detail',
  'product-subscribe',
  'security-detail',
])

const tabs = [
  { path: '/', label: '홈', icon: 'home' },
  { path: PRODUCT_PATH, label: '상품', icon: 'products' },
  { path: VIRTUAL_PATH, label: '가상투자', icon: 'virtual' },
  { path: '/leaderboard', label: '리더보드', icon: 'leaderboard' },
  { path: '/my', label: '마이페이지', icon: 'my' },
]

const contextPath = computed(() => {
  if (!SHARED_DETAIL_ROUTES.has(route.name)) return null
  return route.query.tradable === 'true' ? VIRTUAL_PATH : PRODUCT_PATH
})

const isActive = (path) => {
  if (contextPath.value) return path === contextPath.value
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}

const isLocked = (path) =>
  ASSESSMENT_LOCKED_PATHS.has(path) && !assessmentStore.hasCompleted
</script>

<template>
  <nav
    class="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-white"
    aria-label="주 메뉴"
  >
    <ul class="flex items-stretch">
      <li v-for="tab in tabs" :key="tab.path" class="flex-1">
        <component
          :is="isLocked(tab.path) ? 'div' : RouterLink"
          v-bind="isLocked(tab.path) ? { role: 'button', 'aria-disabled': 'true', tabindex: '-1' } : { to: tab.path }"
          class="flex flex-col items-center gap-2 py-3"
          :class="
            isLocked(tab.path)
              ? 'text-muted'
              : isActive(tab.path)
                ? 'text-blue'
                : 'text-muted'
          "
        >
          <span class="relative">
          <svg
            v-if="tab.icon === 'home'"
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M3 9.5L12 2.5L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M9 21V12H15V21"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <svg
            v-else-if="tab.icon === 'products'"
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M5 7H19L18 20.5C17.9 21.35 17.2 22 16.3 22H7.7C6.8 22 6.1 21.35 6 20.5L5 7Z"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M8 7V5C8 2.79 9.79 1 12 1C14.21 1 16 2.79 16 5V7"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <svg
            v-else-if="tab.icon === 'virtual'"
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="3" y="13" width="4" height="8" rx="1" fill="currentColor" />
            <rect x="10" y="8" width="4" height="13" rx="1" fill="currentColor" />
            <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" />
          </svg>

          <svg
            v-else-if="tab.icon === 'leaderboard'"
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M6 4H18V10C18 13.31 15.31 16 12 16C8.69 16 6 13.31 6 10V4Z"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M6 5H3V7C3 8.66 4.34 10 6 10"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M18 5H21V7C21 8.66 19.66 10 18 10"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12 16V20M8 22H16"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <svg
            v-else-if="tab.icon === 'my'"
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="8"
              r="4"
              stroke="currentColor"
              stroke-width="1.75"
            />
            <path
              d="M4 21C4 16.5817 7.58172 13 12 13C16.4183 13 20 16.5817 20 21"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
            />
          </svg>

          <svg
            v-if="isLocked(tab.path)"
            class="absolute -right-1.5 -top-1 h-3.5 w-3.5 rounded-full bg-white text-muted"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="5" y="10.5" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2" />
            <path d="M8 10.5V7.5C8 5.29 9.79 3.5 12 3.5C14.21 3.5 16 5.29 16 7.5V10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          </span>

          <span class="text-caption font-semibold">{{ tab.label }}</span>
        </component>
      </li>
    </ul>
  </nav>
</template>
