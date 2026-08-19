<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import TabBar from '@/components/common/TabBar.vue'
import NotificationBellButton from '@/components/notification/NotificationBellButton.vue'
import { resolveSwipeTabKey } from '@/utils/swipeNavigation'

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'virtual-assets', label: '자산현황' },
  { key: 'virtual-products', label: '투자하기' },
  { key: 'virtual-history', label: '내역' },
]

const MAIN_TAB_ROUTES = new Set(tabs.map((tab) => tab.key))
const SWIPE_THRESHOLD = 50
const SWIPE_DIRECTION_RATIO = 1.2

const isTabBarVisible = computed(() => MAIN_TAB_ROUTES.has(route.name))

const touchStartX = ref(null)
const touchStartY = ref(null)

const activeTab = computed(() =>
  ['product-holdings', 'product-holding-detail', 'product-termination', 'stock-holdings'].includes(route.name)
    ? 'virtual-assets'
    : route.name,
)

async function handleTabChange(key) {
  const currentIndex = tabs.findIndex((tab) => tab.key === route.name)
  const nextIndex = tabs.findIndex((tab) => tab.key === key)
  if (currentIndex === -1 || nextIndex === -1 || currentIndex === nextIndex) return

  await router.replace({ name: key })
}

function resetTouchStart() {
  touchStartX.value = null
  touchStartY.value = null
}

function handleTouchStart(event) {
  if (
    !isTabBarVisible.value ||
    event.touches.length !== 1
  ) {
    resetTouchStart()
    return
  }

  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
}

function handleTouchEnd(event) {
  if (
    !isTabBarVisible.value ||
    touchStartX.value === null ||
    touchStartY.value === null
  ) {
    resetTouchStart()
    return
  }

  const touch = event.changedTouches[0]
  if (!touch) {
    resetTouchStart()
    return
  }

  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value
  resetTouchStart()

  const nextTabKey = resolveSwipeTabKey({
    tabs,
    currentKey: route.name,
    deltaX,
    deltaY,
    threshold: SWIPE_THRESHOLD,
    directionRatio: SWIPE_DIRECTION_RATIO,
  })
  if (!nextTabKey) return

  handleTabChange(nextTabKey)
}
</script>

<template>
  <PageContainer
    :class="isTabBarVisible ? 'touch-pan-y touch-pinch-zoom overscroll-x-none' : ''"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
    @touchcancel.passive="resetTouchStart"
  >
    <div
      v-if="isTabBarVisible"
      class="sticky top-0 z-10 -mx-5 flex flex-col gap-4 bg-page px-5 pb-4 pt-6"
    >
      <PageHeader title="가상투자">
        <template #actions>
          <NotificationBellButton />
        </template>
      </PageHeader>
      <TabBar :model-value="activeTab" :tabs="tabs" @update:model-value="handleTabChange" />
    </div>
    <RouterView v-slot="{ Component }">
      <keep-alive :include="['VirtualAssetsView', 'VirtualProductsView', 'VirtualHistoryView']">
        <component :is="Component" />
      </keep-alive>
    </RouterView>
  </PageContainer>
</template>
