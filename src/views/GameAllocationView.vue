<script setup>
import { computed, reactive } from 'vue';
import BackButton from '@/components/common/BackButton.vue';
import BaseCard from '@/components/common/BaseCard.vue';
import BottomButton from '@/components/common/BottomButton.vue';
import PageContainer from '@/components/common/PageContainer.vue';
import GameAssetSlider from '@/components/game/GameAssetSlider.vue';
import {
  GAME_ALLOCATION_ADJUSTMENT_PRIORITY,
  GAME_ALLOCATION_STEP,
  GAME_DEPOSIT_INTEREST_RATE,
  GAME_DEPOSIT_MONTHS,
  GAME_DURATION_MONTHS,
  GAME_INITIAL_ALLOCATION,
  GAME_SEED_MONEY,
} from '@/constants/game';
import { formatCurrency, formatInterestRate } from '@/utils/format';

const allocation = reactive({ ...GAME_INITIAL_ALLOCATION });

const assetRatios = computed(() => ({
  cash: (allocation.cash / GAME_SEED_MONEY) * 100,
  deposit: (allocation.deposit / GAME_SEED_MONEY) * 100,
  stock: (allocation.stock / GAME_SEED_MONEY) * 100,
}));

function adjustOtherAssets(assetType, adjustmentAmount, shouldIncrease) {
  const assetPriority = GAME_ALLOCATION_ADJUSTMENT_PRIORITY[assetType];
  let remainingAdjustment = adjustmentAmount;

  assetPriority.forEach((otherAssetType) => {
    if (remainingAdjustment === 0) return;

    const availableAmount = shouldIncrease
      ? GAME_SEED_MONEY - allocation[otherAssetType]
      : allocation[otherAssetType];
    const appliedAmount = Math.min(remainingAdjustment, availableAmount);

    allocation[otherAssetType] += shouldIncrease
      ? appliedAmount
      : -appliedAmount;
    remainingAdjustment -= appliedAmount;
  });
}

function updateAllocation(assetType, nextAmount) {
  const changedAmount = nextAmount - allocation[assetType];

  if (changedAmount > 0) {
    adjustOtherAssets(assetType, changedAmount, false);
  } else if (changedAmount < 0) {
    adjustOtherAssets(assetType, Math.abs(changedAmount), true);
  }

  allocation[assetType] = nextAmount;
}
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <header class="flex flex-col gap-4">
        <BackButton />
        <div class="flex flex-col gap-2">
          <h1 class="text-amount text-ink">시작 자산 설정</h1>
          <p class="text-body text-muted">
            1,000만원을 어떻게 나눌지 정해 주세요.<br />
            이 선택도 성향 진단에 함께 반영돼요.
          </p>
        </div>
      </header>

      <BaseCard>
        <div class="flex flex-col gap-6">
          <section
            class="flex flex-col gap-4"
            aria-labelledby="seed-money-title"
          >
            <h2 id="seed-money-title" class="text-h2 text-ink">시작 자산</h2>
            <div
              class="flex items-center justify-between gap-4 rounded-2xl border border-line bg-base p-4"
            >
              <strong class="text-amount text-ink tabular-nums">
                {{ formatCurrency(GAME_SEED_MONEY) }}
              </strong>
              <span class="text-caption font-semibold text-muted">
                {{ GAME_DURATION_MONTHS }}개월 운용
              </span>
            </div>
            <p class="text-caption text-muted">
              게임에서 운용할 가상 자산이에요.
            </p>
            <p class="text-caption text-muted">
              세 자산의 합계가 1,000만원이 되도록 배분해 주세요.
            </p>

            <div
              class="flex h-2 w-full overflow-hidden rounded-full bg-surface"
              aria-label="초기 자산 배분 비율"
            >
              <span
                class="bg-yellow"
                :style="{ width: `${assetRatios.cash}%` }"
              ></span>
              <span
                class="bg-blue"
                :style="{ width: `${assetRatios.deposit}%` }"
              ></span>
              <span
                class="bg-pink"
                :style="{ width: `${assetRatios.stock}%` }"
              ></span>
            </div>

            <div class="flex gap-4 text-caption text-muted">
              <span class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-yellow"></span>
                현금
              </span>
              <span class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-blue"></span>
                예금
              </span>
              <span class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-pink"></span>
                주식
              </span>
            </div>
          </section>

          <div class="border-t border-line"></div>

          <GameAssetSlider
            id="cash-allocation"
            label="현금"
            color="yellow"
            :amount="allocation.cash"
            :total-amount="GAME_SEED_MONEY"
            :step="GAME_ALLOCATION_STEP"
            @update:amount="updateAllocation('cash', $event)"
          />

          <GameAssetSlider
            id="deposit-allocation"
            label="예금"
            :description="`${GAME_DEPOSIT_MONTHS}개월 · 연 ${formatInterestRate(GAME_DEPOSIT_INTEREST_RATE)} 고정`"
            notice="중도해지하면 재가입할 수 없어요."
            color="blue"
            :amount="allocation.deposit"
            :total-amount="GAME_SEED_MONEY"
            :step="GAME_ALLOCATION_STEP"
            @update:amount="updateAllocation('deposit', $event)"
          />

          <GameAssetSlider
            id="stock-allocation"
            label="주식"
            description="게임 시작 가격 기준으로 투자 금액을 계산해요."
            color="pink"
            :amount="allocation.stock"
            :total-amount="GAME_SEED_MONEY"
            :step="GAME_ALLOCATION_STEP"
            @update:amount="updateAllocation('stock', $event)"
          />

        </div>
      </BaseCard>

      <BottomButton color="yellow">
        성향 진단 시작하기
      </BottomButton>
    </div>
  </PageContainer>
</template>
