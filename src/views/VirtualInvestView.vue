<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import TabBar from '@/components/common/TabBar.vue'
import NotificationBellButton from '@/components/notification/NotificationBellButton.vue'
import { isHorizontalSwipeIntent, resolveSwipeTabKey } from '@/utils/swipeNavigation'

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
const HORIZONTAL_GESTURE_LOCK_THRESHOLD = 8

const isTabBarVisible = computed(() => MAIN_TAB_ROUTES.has(route.name))

const touchStartX = ref(null)
const touchStartY = ref(null)
// swipe 시작 시점의 route를 고정해 둔다. 제스처 도중 다른 트리거로 route가 바뀌면
// (예: 알림 등 다른 경로로 이동) 그 이후 이벤트는 무시하고 swipe를 취소한다.
const touchStartRouteName = ref(null)
const tabTransitionName = ref('')

const activeTab = computed(() =>
  ['product-holdings', 'product-holding-detail', 'product-termination', 'stock-holdings'].includes(route.name)
    ? 'virtual-assets'
    : route.name,
)

function resolveTabTransitionName(oldIndex, newIndex) {
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return ''
  return newIndex > oldIndex ? 'tab-slide-left' : 'tab-slide-right'
}

// handleTabChange(스와이프/탭 클릭 공통 경로)를 거치지 않는 route 변경
// (알림 딥링크 등 외부 진입)까지 방향을 맞춰주기 위한 안전망. handleTabChange에서
// 이미 방향을 미리 설정해 두므로, 여기서는 대부분 같은 값을 다시 계산하게 된다.
watch(
  () => route.name,
  (newName, oldName) => {
    const oldIndex = tabs.findIndex((tab) => tab.key === oldName)
    const newIndex = tabs.findIndex((tab) => tab.key === newName)
    tabTransitionName.value = resolveTabTransitionName(oldIndex, newIndex)
  },
)

async function handleTabChange(key) {
  const currentIndex = tabs.findIndex((tab) => tab.key === route.name)
  const nextIndex = tabs.findIndex((tab) => tab.key === key)
  if (currentIndex === -1 || nextIndex === -1 || currentIndex === nextIndex) return

  // route가 바뀌기 전에 방향을 먼저 확정해서, Transition이 새 화면을 렌더링하는
  // 시점에는 항상 올바른 tabTransitionName이 적용되어 있도록 한다.
  tabTransitionName.value = resolveTabTransitionName(currentIndex, nextIndex)
  await router.replace({ name: key })
}

function resetTouchStart() {
  touchStartX.value = null
  touchStartY.value = null
  touchStartRouteName.value = null
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
  touchStartRouteName.value = route.name
}

// 가로 스와이프 의도가 명확해진 순간부터 preventDefault로 브라우저/WebView의
// 기본 가로 navigation(엣지 스와이프 뒤로가기 등)을 막는다. touchend에서 실제 탭
// 이동을 확정하는 threshold(50px)보다 훨씬 작은 threshold(8px)로 조기에 판단해야
// 브라우저 쪽 제스처 인식보다 먼저 선점할 수 있다. 세로 이동이 우세한 경우에는
// 절대 preventDefault하지 않아 세로 스크롤을 보존한다.
function handleTouchMove(event) {
  if (
    touchStartX.value === null ||
    touchStartY.value === null ||
    touchStartRouteName.value === null ||
    event.touches.length !== 1
  ) {
    return
  }

  // 제스처 도중 route가 바뀌었거나 메인 탭을 벗어났다면 더 이상 관여하지 않는다.
  if (!MAIN_TAB_ROUTES.has(route.name) || route.name !== touchStartRouteName.value) {
    resetTouchStart()
    return
  }

  const touch = event.touches[0]
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value

  const isHorizontalGesture = isHorizontalSwipeIntent({
    deltaX,
    deltaY,
    threshold: HORIZONTAL_GESTURE_LOCK_THRESHOLD,
    directionRatio: SWIPE_DIRECTION_RATIO,
  })

  if (isHorizontalGesture && event.cancelable) {
    event.preventDefault()
  }
}

function handleTouchEnd(event) {
  if (
    !isTabBarVisible.value ||
    touchStartX.value === null ||
    touchStartY.value === null ||
    touchStartRouteName.value === null
  ) {
    resetTouchStart()
    return
  }

  // 제스처 도중 route가 바뀌었거나 메인 탭을 벗어났다면 swipe를 취소한다.
  if (!MAIN_TAB_ROUTES.has(route.name) || route.name !== touchStartRouteName.value) {
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
  const startRouteName = touchStartRouteName.value
  resetTouchStart()

  const nextTabKey = resolveSwipeTabKey({
    tabs,
    currentKey: startRouteName,
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
    @touchmove="handleTouchMove"
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
    <div class="tab-transition-viewport">
      <RouterView v-slot="{ Component }">
        <Transition :name="tabTransitionName">
          <keep-alive :include="['VirtualAssetsView', 'VirtualProductsView', 'VirtualHistoryView']">
            <component :is="Component" />
          </keep-alive>
        </Transition>
      </RouterView>
    </div>
  </PageContainer>
</template>

<style scoped>
.tab-transition-viewport {
  position: relative;
  overflow-x: hidden;
}

/* 나가는 화면(leave)은 밀려나면서(translate) 동시에 흐려지면(opacity) 두 움직임이
   섞여서 실제보다 오래 남아있는 "잔상"처럼 보인다. 방향감은 들어오는 화면(enter)의
   슬라이드만으로 충분히 전달되므로, 나가는 화면은 이동 없이 제자리에서 최대한 짧고
   빠르게 페이드아웃만 시켜 화면에서 빨리 걷어낸다. 각 요소 안에서는 transform·opacity
   길이를 반드시 맞춘다 — 하나가 먼저 끝나면 나머지가 미세하게 계속 움직이는
   "긴 꼬리"가 생긴다. */
.tab-slide-left-leave-active,
.tab-slide-right-leave-active {
  /* 나가는 화면만 문서 흐름에서 빼서, 들어오는 화면의 실제 높이가 즉시 컨테이너
     높이를 결정하도록 한다(높이가 많이 다른 화면 간 전환에서 높이가 튀는 것 방지). */
  position: absolute;
  inset: 0;
  width: 100%;
  z-index: 0;
  transition: opacity 90ms ease-out;
  will-change: opacity;
}

/* CSS 페인트 순서상 positioned 요소는 static 요소보다 항상 위에 그려진다.
   leave가 absolute(positioned)이므로, enter도 positioned로 만들고 더 높은
   z-index를 줘야 들어오는 화면이 나가는 화면 위에서 자연스럽게 겹쳐 보인다.
   이걸 빠뜨리면 나가는 화면이 항상 위에 깔려 다음 화면이 아래에서 비쳐 보인다. */
.tab-slide-left-enter-active,
.tab-slide-right-enter-active {
  position: relative;
  z-index: 1;
  transition: transform 180ms cubic-bezier(0, 0, 0.2, 1), opacity 180ms cubic-bezier(0, 0, 0.2, 1);
  will-change: transform, opacity;
}

.tab-slide-left-enter-from {
  transform: translateX(32px);
  opacity: 0;
}

.tab-slide-right-enter-from {
  transform: translateX(-32px);
  opacity: 0;
}

.tab-slide-left-leave-to,
.tab-slide-right-leave-to {
  opacity: 0;
}
</style>
