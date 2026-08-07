<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "@/api/http";
import { fetchProductHoldings } from "@/api/productApi";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import ProductHoldingCard from "@/components/product/ProductHoldingCard.vue";

const route = useRoute();
const router = useRouter();

const holdings = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");

const hasSubscriptionSuccess = computed(
  () => route.query.subscribed === "true",
);

function getErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
    }
    return error.message;
  }
  return "보유 상품을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

async function loadHoldings() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    holdings.value = await fetchProductHoldings();
  } catch (error) {
    holdings.value = [];
    errorMessage.value = getErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

function handleBrowseProducts() {
  router.push({ name: "products" });
}

function handleSelectHolding(holding) {
  router.push({
    name: "product-holding-detail",
    params: { holdingProductId: holding.holdingProductId },
  });
}

onMounted(loadHoldings);
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-center gap-2">
      <BackButton />
      <div class="flex flex-col gap-2">
        <h1 class="text-h1 text-ink">내 예적금</h1>
        <p class="text-caption text-muted">가입한 예금과 적금을 확인해 보세요.</p>
      </div>
    </header>

    <BaseCard v-if="hasSubscriptionSuccess" color="green">
      <div class="flex flex-col gap-2" role="status">
        <h2 class="text-h2 text-ink">상품 가입이 완료됐어요</h2>
        <p class="text-caption text-muted">
          가입한 상품이 보유 상품 목록에 반영되었습니다.
        </p>
      </div>
    </BaseCard>

    <BaseCard v-if="isLoading" color="blue">
      <div class="flex flex-col gap-2" role="status">
        <h2 class="text-h2 text-ink">보유 상품을 불러오는 중이에요</h2>
        <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="errorMessage" color="pink">
      <div class="flex flex-col gap-4" role="alert">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">보유 상품을 불러오지 못했어요</h2>
          <p class="text-caption text-muted">{{ errorMessage }}</p>
        </div>
        <BottomButton color="white" @click="loadHoldings">
          다시 시도하기
        </BottomButton>
      </div>
    </BaseCard>

    <template v-else-if="holdings.length">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-h2 text-ink">보유 상품</h2>
        <p class="text-caption text-muted tabular-nums">
          총 {{ holdings.length }}개
        </p>
      </div>

      <div class="flex flex-col gap-4">
        <ProductHoldingCard
          v-for="holding in holdings"
          :key="holding.holdingProductId"
          :holding="holding"
          @select="handleSelectHolding"
        />
      </div>

      <BottomButton color="white" @click="handleBrowseProducts">
        다른 상품 둘러보기
      </BottomButton>
    </template>

    <BaseCard v-else color="yellow">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">아직 보유한 예적금이 없어요</h2>
          <p class="text-caption text-muted">
            상품을 둘러보고 나에게 맞는 예금이나 적금에 가입해 보세요.
          </p>
        </div>
        <BottomButton @click="handleBrowseProducts">
          예적금 상품 둘러보기
        </BottomButton>
      </div>
    </BaseCard>
  </div>
</template>
