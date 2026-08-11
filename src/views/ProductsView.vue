<script setup>
import PageContainer from "@/components/common/PageContainer.vue";
import ProductListPanel from "@/components/product/ProductListPanel.vue";
</script>

<template>
  <PageContainer color="white">
    <ProductListPanel :standalone="true" />
  </PageContainer>
</template>
