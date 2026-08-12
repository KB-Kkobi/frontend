<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageContainer from '@/components/common/PageContainer.vue'
import TabBar from '@/components/common/TabBar.vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'virtual-assets', label: '자산현황' },
  { key: 'virtual-products', label: '상품' },
  { key: 'virtual-history', label: '내역' },
]

const HIDDEN_TABBAR_ROUTES = ['virtual-trade', 'security-detail']

const isTabBarVisible = computed(() => !HIDDEN_TABBAR_ROUTES.includes(route.name))

const activeTab = computed(() =>
  ['product-holdings', 'product-holding-detail', 'product-termination'].includes(route.name)
    ? 'virtual-assets'
    : route.name,
)

function handleTabChange(key) {
  router.push({ name: key })
}
</script>

<template>
  <PageContainer>
    <div
      v-if="isTabBarVisible"
      class="sticky top-0 z-10 -mx-5 flex flex-col gap-4 bg-base px-5 pb-4 pt-6"
    >
      <h1 class="text-h1 text-ink">가상투자</h1>
      <TabBar :model-value="activeTab" :tabs="tabs" @update:model-value="handleTabChange" />
    </div>
    <RouterView v-slot="{ Component }">
      <keep-alive :include="['VirtualAssetsView', 'VirtualProductsView', 'VirtualHistoryView']">
        <component :is="Component" />
      </keep-alive>
    </RouterView>
  </PageContainer>
</template>
