<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "@/api/http";
import {
  PRODUCT_API_ERROR_CODES,
  ProductApiError,
  estimateProductSubscription,
  fetchProductDetail,
  subscribeProduct,
} from "@/api/productApi";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseModal from "@/components/common/BaseModal.vue";
import BasePill from "@/components/common/BasePill.vue";
import BaseTextField from "@/components/common/BaseTextField.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import ProductBankLogo from "@/components/product/ProductBankLogo.vue";
import ProductPreferentialConditionSelector from "@/components/product/ProductPreferentialConditionSelector.vue";
import ProductSubscriptionOptionCard from "@/components/product/ProductSubscriptionOptionCard.vue";
import {
  PRODUCT_AMOUNT_OPTIONS,
  PRODUCT_PAYMENT_DAYS,
  PRODUCT_SUBSCRIPTION_ESTIMATE_DEBOUNCE_MS,
  PRODUCT_TYPES,
  getProductTypeLabel,
  normalizeProductType,
} from "@/constants/product";
import { debounce } from "@/utils/debounce";
import { formatLocalDate } from "@/utils/date";
import {
  formatCurrency,
  formatCurrencyInput,
  formatInterestRate,
  formatKoreanShortAmount,
  formatNullableText,
  parseCurrencyInput,
} from "@/utils/format";

const route = useRoute();
const router = useRouter();

const product = ref(null);
const selectedOptionId = ref(null);
const joinAmountInput = ref("");
const paymentDay = ref("");
const selectedPreferentialRateConditionIds = ref([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const isEstimating = ref(false);
const isEstimateRefreshing = ref(false);
const estimateErrorMessage = ref("");
const loadErrorMessage = ref("");
const amountErrorMessage = ref("");
const paymentDayErrorMessage = ref("");
const formErrorMessage = ref("");
const isConfirmationOpen = ref(false);
const subscriptionEstimate = ref(null);
const estimateRequestToken = ref(0);

const productType = computed(() =>
  normalizeProductType(product.value?.productType ?? route.params.productType),
);
const isSaving = computed(() => productType.value === PRODUCT_TYPES.SAVING);
const productTypeLabel = computed(() => getProductTypeLabel(productType.value));
const pageTitle = computed(() => `${productTypeLabel.value} 가입`);
const productOptions = computed(() =>
  Array.isArray(product.value?.options) ? product.value.options : [],
);
const selectedOption = computed(() =>
  productOptions.value.find(
    (option) => option.productOptionId === selectedOptionId.value,
  ),
);
const joinAmount = computed(() => parseCurrencyInput(joinAmountInput.value));
const amountLabel = computed(() =>
  isSaving.value ? "월 납입 금액" : "가입 금액",
);
const amountHint = computed(() =>
  product.value?.maxLimit
    ? `가입 가능 금액은 최대 ${formatCurrency(product.value.maxLimit)}이에요.`
    : "원 단위로 입력해 주세요.",
);

const minimumInterestRate = computed(() => {
  const rates = productOptions.value
    .map((option) => Number(option.interestRate))
    .filter(Number.isFinite);
  return rates.length ? Math.min(...rates) : null;
});

const maximumInterestRate = computed(() => {
  const rates = productOptions.value
    .map((option) => Number(option.maximumInterestRate))
    .filter(Number.isFinite);
  return rates.length ? Math.max(...rates) : null;
});

const appliedRate = computed(() => subscriptionEstimate.value?.appliedRate ?? null);

// 실제 선택으로 인해 기본 금리 대비 얼마나 올랐는지(서버 계산 결과 기준).
const appliedRateUplift = computed(() => {
  const baseRate = Number(selectedOption.value?.interestRate);
  if (appliedRate.value === null || !Number.isFinite(baseRate)) return null;
  const uplift = Number(appliedRate.value) - baseRate;
  return Number.isFinite(uplift) && uplift > 0 ? uplift : 0;
});

// 화면 표시 전용 예상금리(선택 즉시 반영). 실제 가입/최종 확정에는 쓰지 않고,
// 서버 예상조회가 아직 없거나 우대조건이 방금 바뀌어 무효화된 상태에서만 보여준다.
// selectable=false·additionalRate=null 조건은 합산에서 제외한다.
const localPreviewRate = computed(() => {
  const baseRate = Number(selectedOption.value?.interestRate);
  if (!Number.isFinite(baseRate)) return null;

  const conditions = Array.isArray(selectedOption.value?.preferentialRateConditions)
    ? selectedOption.value.preferentialRateConditions
    : [];
  const additionalRateSum = conditions
    .filter(
      (condition) =>
        condition.selectable &&
        condition.additionalRate !== null &&
        condition.additionalRate !== undefined &&
        selectedPreferentialRateConditionIds.value.includes(
          condition.preferentialRateConditionId,
        ),
    )
    .reduce((sum, condition) => sum + Number(condition.additionalRate), 0);

  const rawRate = baseRate + additionalRateSum;
  const maximumRate = Number(selectedOption.value?.maximumInterestRate);
  return Number.isFinite(maximumRate) && rawRate > maximumRate
    ? maximumRate
    : rawRate;
});

// 백그라운드 재계산 중에는 기존 카드 값을 유지하되, 금리 선택 영역은 현재
// 선택을 기준으로 즉시 안내한다. 새 응답이 도착하면 서버 결과로 전환한다.
const isEstimateConfirmed = computed(
  () => Boolean(subscriptionEstimate.value) && !isEstimateRefreshing.value,
);

// 확정 전엔 화면용 로컬 계산값을, 확정 후엔 서버 appliedRate를 보여준다.
const displayRate = computed(() =>
  isEstimateConfirmed.value ? appliedRate.value : localPreviewRate.value,
);
const expectedMaturityDate = computed(
  () => subscriptionEstimate.value?.maturityDate ?? null,
);
const expectedAmounts = computed(() => ({
  expectedPrincipal: subscriptionEstimate.value?.expectedPrincipal ?? null,
  expectedInterest: subscriptionEstimate.value?.expectedAfterTaxInterest ?? null,
  expectedAmount: subscriptionEstimate.value?.expectedMaturityAmount ?? null,
}));

const amountOptions = computed(() => {
  const options = PRODUCT_AMOUNT_OPTIONS[productType.value] ?? [];
  const maximumLimitValue = product.value?.maxLimit;
  if (maximumLimitValue === null || maximumLimitValue === undefined) return options;

  const maximumLimit = Number(maximumLimitValue);
  if (!Number.isFinite(maximumLimit)) return options;
  return options.filter((amount) => amount <= maximumLimit);
});

const confirmationMessage = computed(() => {
  if (!product.value || !subscriptionEstimate.value) return "";
  return `${product.value.productName}에 ${formatCurrency(joinAmount.value)}으로 가입할까요? 적용 금리는 ${formatInterestRate(appliedRate.value)}, 예상 만기일은 ${formatLocalDate(expectedMaturityDate.value)}입니다.`;
});

function getRequestErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
    }
    return error.message;
  }
  return "상품 가입 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function getLoadErrorMessage(error) {
  if (error instanceof ProductApiError) {
    if (error.code === PRODUCT_API_ERROR_CODES.UNAUTHORIZED) {
      return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
    }
    return error.message;
  }
  return "상품 정보를 불러오지 못했습니다.";
}

function handleSelectOption(option) {
  selectedOptionId.value = option.productOptionId;
  // 옵션마다 선택 가능한 우대조건 ID가 다르므로 이전 선택은 초기화한다.
  selectedPreferentialRateConditionIds.value = [];
  formErrorMessage.value = "";
  queueLiveEstimate({ clearExisting: true });
}

function handleAmountInput(value) {
  joinAmountInput.value = formatCurrencyInput(value);
  amountErrorMessage.value = "";
  formErrorMessage.value = "";
  queueLiveEstimate();
}

function handleSelectAmount(amount) {
  handleAmountInput(String(amount));
}

function handlePreferentialConditionsUpdate(conditionIds) {
  selectedPreferentialRateConditionIds.value = conditionIds;
  queueLiveEstimate();
}

function validateForm() {
  amountErrorMessage.value = "";
  paymentDayErrorMessage.value = "";
  formErrorMessage.value = "";

  if (!selectedOption.value) {
    formErrorMessage.value = "가입할 금리 옵션을 선택해 주세요.";
    return false;
  }

  if (!joinAmount.value || joinAmount.value <= 0) {
    amountErrorMessage.value = `${amountLabel.value}을 입력해 주세요.`;
    return false;
  }

  const maximumLimitValue = product.value?.maxLimit;
  if (maximumLimitValue !== null && maximumLimitValue !== undefined) {
    const maximumLimit = Number(maximumLimitValue);
    if (Number.isFinite(maximumLimit) && joinAmount.value > maximumLimit) {
      amountErrorMessage.value = "상품의 최고 가입 한도를 초과했습니다.";
      return false;
    }
  }

  if (isSaving.value && !paymentDay.value) {
    paymentDayErrorMessage.value = "월 납입일을 선택해 주세요.";
    return false;
  }

  return true;
}

function createSubscriptionRequest() {
  const request = {
    productOptionId: selectedOption.value.productOptionId,
    joinAmount: joinAmount.value,
    selectedPreferentialRateConditionIds: [
      ...selectedPreferentialRateConditionIds.value,
    ],
  };
  if (isSaving.value) request.paymentDay = Number(paymentDay.value);
  return request;
}

// 폼이 아직 예상조회를 보낼 만큼 유효하지 않으면 불필요한 요청을 막는다.
const canEstimate = computed(() => {
  if (!selectedOption.value) return false;
  if (!joinAmount.value || joinAmount.value <= 0) return false;

  const maximumLimit = Number(product.value?.maxLimit);
  if (Number.isFinite(maximumLimit) && joinAmount.value > maximumLimit) {
    return false;
  }

  if (isSaving.value && !paymentDay.value) return false;
  return true;
});

// 서버가 금액·납입일 없이는 예상금리 계산을 거부하므로, 만기 예상금액을
// 보려면 무엇을 더 입력해야 하는지 안내한다(우대조건 선택 자체는 이미
// localPreviewRate로 즉시 반영되므로 "왜 안 바뀌냐"는 안내는 아님).
const estimateHint = computed(() => {
  if (canEstimate.value || !selectedOption.value) return "";
  return isSaving.value
    ? "월 납입금액과 납입일을 입력하면 예상 만기 수령액을 확인할 수 있어요."
    : "가입금액을 입력하면 예상 만기 수령액을 확인할 수 있어요.";
});

// estimate/subscribe 양쪽에서 재사용. 요청 도중 입력이 바뀌면(token 불일치)
// 오래된 응답으로 최신 상태를 덮어쓰지 않는다.
async function fetchEstimate() {
  const token = ++estimateRequestToken.value;
  try {
    const estimate = await estimateProductSubscription(createSubscriptionRequest());
    return token === estimateRequestToken.value ? estimate : null;
  } catch (error) {
    // 입력이 바뀐 뒤 도착한 이전 요청의 실패도 최신 화면을 덮어쓰지 않는다.
    if (token !== estimateRequestToken.value) return null;
    throw error;
  }
}

async function refreshLiveEstimate() {
  if (!canEstimate.value) {
    subscriptionEstimate.value = null;
    isEstimateRefreshing.value = false;
    estimateErrorMessage.value = "";
    return;
  }

  const requestToken = estimateRequestToken.value + 1;
  try {
    const estimate = await fetchEstimate();
    if (!estimate) return;
    subscriptionEstimate.value = estimate;
    estimateErrorMessage.value = "";
    formErrorMessage.value = "";
  } catch (error) {
    estimateErrorMessage.value = getRequestErrorMessage(error);
  } finally {
    if (requestToken === estimateRequestToken.value) {
      isEstimateRefreshing.value = false;
    }
  }
}

const refreshLiveEstimateDebounced = debounce(
  refreshLiveEstimate,
  PRODUCT_SUBSCRIPTION_ESTIMATE_DEBOUNCE_MS,
);

function queueLiveEstimate({ clearExisting = false } = {}) {
  refreshLiveEstimateDebounced.cancel();
  // debounce 대기 중에도 이전 요청이 현재 입력의 결과처럼 반영되지 않도록 즉시 무효화한다.
  estimateRequestToken.value += 1;

  if (clearExisting || !canEstimate.value) {
    subscriptionEstimate.value = null;
  }

  if (!canEstimate.value) {
    isEstimateRefreshing.value = false;
    estimateErrorMessage.value = "";
    return;
  }

  isEstimateRefreshing.value = true;
  estimateErrorMessage.value = "";
  formErrorMessage.value = "";
  refreshLiveEstimateDebounced();
}

async function handleOpenConfirmation() {
  if (!validateForm() || isEstimating.value) return;

  refreshLiveEstimateDebounced.cancel();
  isEstimating.value = true;
  isEstimateRefreshing.value = false;
  formErrorMessage.value = "";

  try {
    const estimate = await fetchEstimate();
    if (!estimate) return;
    subscriptionEstimate.value = estimate;
    estimateErrorMessage.value = "";
    isConfirmationOpen.value = true;
  } catch (error) {
    formErrorMessage.value = getRequestErrorMessage(error);
  } finally {
    isEstimating.value = false;
  }
}

async function handleSubscribe() {
  if (!validateForm() || isSubmitting.value) return;

  isSubmitting.value = true;
  formErrorMessage.value = "";

  try {
    await subscribeProduct(createSubscriptionRequest());
    await router.push({
      name: "virtual-assets",
      query: { subscribed: "true" },
    });
  } catch (error) {
    formErrorMessage.value = getRequestErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
}

async function loadProduct() {
  refreshLiveEstimateDebounced.cancel();
  isLoading.value = true;
  loadErrorMessage.value = "";
  product.value = null;
  selectedOptionId.value = null;
  selectedPreferentialRateConditionIds.value = [];
  subscriptionEstimate.value = null;
  isEstimateRefreshing.value = false;
  estimateErrorMessage.value = "";
  estimateRequestToken.value += 1;

  try {
    product.value = await fetchProductDetail(
      route.params.productType,
      route.params.productId,
    );
    const defaultOption =
      product.value?.options?.find((option) => option.savingTerm === 12) ??
      product.value?.options?.[0];
    selectedOptionId.value = defaultOption?.productOptionId ?? null;
  } catch (error) {
    loadErrorMessage.value = getLoadErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

watch(paymentDay, () => {
  paymentDayErrorMessage.value = "";
  queueLiveEstimate();
});

watch(
  () => [route.params.productType, route.params.productId],
  loadProduct,
  { immediate: true },
);

onBeforeUnmount(() => {
  refreshLiveEstimateDebounced.cancel();
  estimateRequestToken.value += 1;
});
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-4 py-6">
      <header class="flex items-center gap-2">
        <BackButton />
        <h1 class="text-h1 text-ink">{{ pageTitle }}</h1>
      </header>

      <BaseCard v-if="isLoading" color="blue">
        <div class="flex flex-col gap-2" role="status">
          <h2 class="text-h2 text-ink">가입 정보를 준비하고 있어요</h2>
          <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
        </div>
      </BaseCard>

      <BaseCard v-else-if="loadErrorMessage" color="white" elevation="flat">
        <div class="flex flex-col gap-4" role="alert">
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-ink">상품 정보를 불러오지 못했어요</h2>
            <p class="text-caption text-muted">{{ loadErrorMessage }}</p>
          </div>
          <BottomButton color="white" @click="loadProduct">다시 시도하기</BottomButton>
        </div>
      </BaseCard>

      <template v-else-if="product">
        <BaseCard color="white">
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-4">
              <ProductBankLogo :name="product.financialCompanyName" />
              <div class="flex min-w-0 flex-1 flex-col gap-2">
                <h2 class="text-h2 text-ink">{{ product.productName }}</h2>
                <p class="text-caption text-muted">
                  {{ formatNullableText(product.financialCompanyName) }}
                </p>
              </div>
            </div>

            <dl class="grid grid-cols-2 gap-4 border-t border-line pt-4">
              <div class="flex flex-col gap-2">
                <dt class="text-caption text-muted">기본 금리</dt>
                <dd class="text-h1 text-ink tabular-nums">
                  {{ formatInterestRate(minimumInterestRate) }}
                </dd>
              </div>
              <div class="flex flex-col gap-2">
                <dt class="text-caption text-muted">최고 금리</dt>
                <dd class="text-h1 text-profit tabular-nums">
                  {{ formatInterestRate(maximumInterestRate) }}
                </dd>
              </div>
            </dl>

            <div class="flex flex-wrap gap-2">
              <BasePill
                :label="formatNullableText(selectedOption?.interestRateTypeName)"
                color="blue"
              />
              <BasePill
                v-if="isSaving && selectedOption?.reserveTypeName"
                :label="selectedOption.reserveTypeName"
                color="green"
              />
            </div>
          </div>
        </BaseCard>

        <BaseCard color="white">
          <div class="flex flex-col gap-4">
            <section class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <h2 class="text-h2 text-ink">가입 기간 고르기</h2>
                <p class="text-caption text-muted">기간에 따라 금리가 달라져요.</p>
              </div>

              <div
                v-if="isSaving"
                class="flex flex-col gap-4"
                role="radiogroup"
                aria-label="가입 금리 옵션"
              >
                <ProductSubscriptionOptionCard
                  v-for="option in productOptions"
                  :key="option.productOptionId"
                  :option="option"
                  :is-selected="selectedOptionId === option.productOptionId"
                  elevation="flat"
                  @select="handleSelectOption"
                />
              </div>

              <div v-else class="flex flex-wrap gap-2" role="radiogroup" aria-label="가입 기간">
                <BasePill
                  v-for="option in productOptions"
                  :key="option.productOptionId"
                  as="button"
                  type="button"
                  :label="`${option.savingTerm}개월`"
                  color="pink"
                  :variant="selectedOptionId === option.productOptionId ? 'filled' : 'ghost'"
                  :aria-pressed="selectedOptionId === option.productOptionId"
                  @click="handleSelectOption(option)"
                />
              </div>
            </section>

            <div class="flex flex-col gap-4 border-t border-line pt-4">
              <BaseTextField
                id="join-amount"
                :model-value="joinAmountInput"
                :label="amountLabel"
                inputmode="numeric"
                placeholder="금액을 입력해 주세요"
                trailing-text="원"
                :hint="amountHint"
                :error-message="amountErrorMessage"
                @update:model-value="handleAmountInput"
              />

              <div class="flex flex-wrap gap-2" aria-label="추천 가입 금액">
                <BasePill
                  v-for="amount in amountOptions"
                  :key="amount"
                  as="button"
                  type="button"
                  :label="formatKoreanShortAmount(amount)"
                  color="pink"
                  :variant="joinAmount === amount ? 'filled' : 'ghost'"
                  @click="handleSelectAmount(amount)"
                />
              </div>

              <div v-if="isSaving" class="flex flex-col gap-2">
                <label for="payment-day" class="text-body font-semibold text-ink">
                  납입일
                </label>
                <div class="rounded-2xl border border-line bg-white px-4">
                  <select
                    id="payment-day"
                    v-model="paymentDay"
                    class="w-full bg-white py-3 text-body text-ink outline-none"
                    :aria-invalid="Boolean(paymentDayErrorMessage)"
                    @change="paymentDayErrorMessage = ''"
                  >
                    <option value="">월 납입일을 선택해 주세요</option>
                    <option v-for="day in PRODUCT_PAYMENT_DAYS" :key="day" :value="day">
                      매월 {{ day }}일
                    </option>
                  </select>
                </div>
                <p
                  v-if="paymentDayErrorMessage"
                  class="text-caption text-error"
                  role="alert"
                >
                  {{ paymentDayErrorMessage }}
                </p>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard color="white">
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between gap-4">
              <span class="text-caption text-muted">기본금리</span>
              <strong class="text-body text-ink tabular-nums">
                {{ formatInterestRate(selectedOption?.interestRate) }}
              </strong>
            </div>

            <div class="border-t border-line pt-4">
              <ProductPreferentialConditionSelector
                :conditions="selectedOption?.preferentialRateConditions ?? []"
                :model-value="selectedPreferentialRateConditionIds"
                @update:model-value="handlePreferentialConditionsUpdate"
              />
            </div>

            <div class="flex flex-col gap-2 border-t border-line pt-4">
              <div class="flex items-center justify-between gap-4">
                <span class="text-caption text-muted">예상 적용금리</span>
                <strong class="text-h2 text-profit tabular-nums">
                  {{ formatInterestRate(displayRate) }}
                </strong>
              </div>
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-caption text-muted">최고금리</span>
              <strong class="text-body text-ink tabular-nums">
                {{ formatInterestRate(selectedOption?.maximumInterestRate) }}
              </strong>
            </div>
          </div>
        </BaseCard>

        <BaseCard v-if="selectedOption" color="blue">
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-h2 text-ink">내 예상 수령액</h2>
              <p
                v-if="isEstimateRefreshing"
                class="text-caption text-muted"
                role="status"
              >
                예상 금액 계산 중...
              </p>
            </div>

            <p
              v-if="!canEstimate && !subscriptionEstimate"
              class="text-caption text-muted"
            >
              {{ estimateHint }}
            </p>

            <template v-else>
              <div
                v-if="estimateErrorMessage"
                class="flex flex-col gap-2"
                role="alert"
              >
                <p class="text-caption text-error">
                  {{
                    subscriptionEstimate
                      ? "예상 금액을 업데이트하지 못했어요. 이전 계산 결과를 표시하고 있어요."
                      : "예상 금액을 다시 계산하지 못했어요."
                  }}
                </p>
                <p class="text-caption text-muted">{{ estimateErrorMessage }}</p>
              </div>

              <dl class="flex flex-col gap-2">
                <div class="flex items-center justify-between gap-4">
                  <dt class="text-caption text-muted">기본 금리</dt>
                  <dd class="text-body text-ink tabular-nums">
                    {{ formatInterestRate(selectedOption?.interestRate) }}
                  </dd>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <dt class="text-caption text-muted">우대 금리</dt>
                  <dd class="text-body text-profit tabular-nums">
                    {{
                      subscriptionEstimate
                        ? `+${formatInterestRate(appliedRateUplift)}`
                        : "—"
                    }}
                  </dd>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <dt class="text-caption text-muted">적용 금리</dt>
                  <dd class="text-h2 text-profit tabular-nums">
                    {{ formatInterestRate(appliedRate) }}
                  </dd>
                </div>
              </dl>

              <dl class="flex flex-col gap-2 border-t border-line pt-4">
                <div class="flex items-center justify-between gap-4">
                  <dt class="text-caption text-muted">예상 원금</dt>
                  <dd class="text-body text-ink tabular-nums">
                    {{ formatCurrency(expectedAmounts.expectedPrincipal) }}
                  </dd>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <dt class="text-caption text-muted">세후 예상 이자</dt>
                  <dd class="text-body text-ink tabular-nums">
                    {{ formatCurrency(expectedAmounts.expectedInterest) }}
                  </dd>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <dt class="text-body font-semibold text-ink">만기 수령액</dt>
                  <dd class="text-amount text-profit tabular-nums">
                    {{ formatCurrency(expectedAmounts.expectedAmount) }}
                  </dd>
                </div>
              </dl>

              <BaseCard
                :color="subscriptionEstimate ? 'green' : 'white'"
                :elevation="subscriptionEstimate ? 'default' : 'flat'"
              >
                <p v-if="subscriptionEstimate" class="text-caption text-muted">
                  만기일은 {{ formatLocalDate(expectedMaturityDate) }}이며, 실제 이자는 납입일과
                  상품 조건에 따라 달라질 수 있어요.
                </p>
                <p v-else-if="estimateErrorMessage" class="text-caption text-muted">
                  입력값을 확인하거나 잠시 후 다시 시도해 주세요.
                </p>
                <p v-else class="text-caption text-muted">
                  입력한 조건으로 만기일과 예상금액을 계산하고 있어요.
                </p>
              </BaseCard>
            </template>
          </div>
        </BaseCard>

        <p v-if="formErrorMessage" class="text-body text-error" role="alert">
          {{ formErrorMessage }}
        </p>

        <BottomButton
          color="pink"
          :disabled="isSubmitting || isEstimating || !productOptions.length"
          @click="handleOpenConfirmation"
        >
          {{
            isSubmitting
              ? "가입 처리 중"
              : isEstimating
                ? "예상 금액 확인 중"
                : "가입하기"
          }}
        </BottomButton>
        <p class="text-caption text-muted text-center">
          가입 자산은 가상투자 계좌에 반영됩니다.
        </p>
      </template>
    </div>
  </PageContainer>

  <BaseModal
    v-model="isConfirmationOpen"
    :message="confirmationMessage"
    confirm-text="가입하기"
    cancel-text="다시 확인"
    @confirm="handleSubscribe"
  />
</template>
