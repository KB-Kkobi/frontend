<script setup>
import { defineOptions } from "vue";
import ProductListPanel from "@/components/product/ProductListPanel.vue";

defineOptions({ name: "VirtualProductsView" });
</script>

<template>
  <ProductListPanel :standalone="false" :tradable="true" />
</template>
