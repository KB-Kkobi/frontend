<script setup>
import { onActivated, ref } from "vue";
import { fetchAccountAssetStatus } from "@/api/accountApi";
import BaseCard from "@/components/common/BaseCard.vue";
import ProductListPanel from "@/components/product/ProductListPanel.vue";
import { formatCurrency } from "@/utils/format";

defineOptions({ name: "VirtualProductsView" });

const cashBalance = ref(null);
const isCashBalanceLoading = ref(false);
const hasCashBalanceError = ref(false);

async function loadCashBalance() {
  // 최초 조회일 때만 "불러오는 중" 문구를 보여준다. 재진입 시 재조회까지 매번
  // 문구가 깜빡이며 나타났다 사라지는 것을 막기 위함.
  const isInitialLoad = cashBalance.value === null;
  if (isInitialLoad) {
    isCashBalanceLoading.value = true;
  }
  hasCashBalanceError.value = false;

  try {
    const account = await fetchAccountAssetStatus();
    const rawCashBalance = account?.cashBalance;
    const nextCashBalance =
      rawCashBalance === null || rawCashBalance === undefined || rawCashBalance === ""
        ? Number.NaN
        : Number(rawCashBalance);

    if (!Number.isFinite(nextCashBalance)) {
      throw new Error("Invalid cash balance");
    }

    cashBalance.value = nextCashBalance;
  } catch (error) {
    if (!isInitialLoad) {
      // 백그라운드 재조회 실패는 화면에 이미 떠 있는 값을 그대로 유지한다.
      console.error("[VirtualProductsView] 잔액 재조회 실패", error);
      return;
    }
    cashBalance.value = null;
    hasCashBalanceError.value = true;
  } finally {
    isCashBalanceLoading.value = false;
  }
}

// keep-alive 화면이므로 최초 진입과 상세·거래 화면 복귀 때마다 잔액을 갱신한다.
onActivated(() => {
  loadCashBalance();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <BaseCard color="blue">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <p class="text-caption font-semibold text-blue">가상투자 계좌</p>
          <h2 class="text-h2 text-ink">가상 자산으로 투자해보세요</h2>
          <p class="text-caption text-muted tracking-tight">
            상품을 선택하면 가상 계좌의 자산으로 투자할 수 있어요.
          </p>
        </div>

        <div class="flex flex-col gap-2 border-t border-line-soft pt-4">
          <p class="text-caption text-muted">사용 가능 금액</p>
          <strong class="text-amount text-ink tabular-nums">
            {{ formatCurrency(cashBalance) }}
          </strong>
          <p
            v-if="isCashBalanceLoading"
            class="text-caption text-muted"
            role="status"
          >
            최신 잔액을 불러오는 중이에요.
          </p>
          <p
            v-else-if="hasCashBalanceError"
            class="text-caption text-muted"
            role="alert"
          >
            잔액을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.
          </p>
        </div>
      </div>
    </BaseCard>

    <ProductListPanel :standalone="false" :tradable="true" />
  </div>
</template>
