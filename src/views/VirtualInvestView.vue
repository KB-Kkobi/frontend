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

const activeTab = computed(() =>
  ['product-holdings', 'product-holding-detail'].includes(route.name)
    ? 'virtual-assets'
    : route.name,
)

function handleTabChange(key) {
  router.push({ name: key })
}
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-4 py-6">
      <h1 class="text-h1 text-ink">가상투자</h1>
      <TabBar :model-value="activeTab" :tabs="tabs" @update:model-value="handleTabChange" />
    </div>
    <RouterView />
  </PageContainer>
</template>
