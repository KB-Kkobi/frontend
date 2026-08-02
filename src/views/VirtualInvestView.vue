<script setup>
import { ref } from "vue";
import PageContainer from "@/components/common/PageContainer.vue";
import TabBar from "@/components/common/TabBar.vue";

const activeTab = ref("assets");
const tabs = [
  { key: "assets", label: "자산현황" },
  { key: "products", label: "상품" },
  { key: "history", label: "내역" },
];
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-4 py-6">
      <h1 class="text-h1 text-ink">가상투자</h1>
      <TabBar v-model="activeTab" :tabs="tabs" />
    </div>
  </PageContainer>
</template>
