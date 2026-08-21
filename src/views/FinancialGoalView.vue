<script setup>
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ApiError } from "@/api/http";
import {
  deleteFinancialGoal,
  fetchFinancialGoal,
  saveFinancialGoal,
} from "@/api/financialGoalApi";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseModal from "@/components/common/BaseModal.vue";
import BaseTextField from "@/components/common/BaseTextField.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import {
  FINANCIAL_GOAL_TYPES,
  MAX_GOAL_AMOUNT,
  MAX_GOAL_MONTHS,
  QUICK_TARGET_MONTHS,
} from "@/constants/financialGoal";
import {
  formatCurrency,
  formatCurrencyInput,
  formatKoreanShortAmount,
  parseCurrencyInput,
} from "@/utils/format";

const router = useRouter();

const form = reactive({
  goalType: "",
  customGoalName: "",
  targetAmount: "",
  targetMonths: "",
  currentAmount: "0",
});
const errors = reactive({});
const savedGoal = ref(null);
const resultCard = ref(null);
const isLoading = ref(true);
const isEditing = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const isDeleteConfirmOpen = ref(false);
const errorMessage = ref("");

const isOtherGoal = computed(() => form.goalType === "OTHER");
const recommendedProductSummary = computed(() => {
  if (!savedGoal.value) return "";
  if (!savedGoal.value.goalMatched) {
    return "기간 제한 없이 상품 보기";
  }
  return `${savedGoal.value.recommendedSavingTerm}개월 상품`;
});
const recommendationHint = computed(() => {
  if (!savedGoal.value) return "";
  if (savedGoal.value.remainingAmount === 0) {
    return "목표 금액만큼 이미 준비되어 있어요. 목표 시점에 맞는 상품을 확인해 보세요.";
  }
  if (!savedGoal.value.goalMatched) {
    return "목표 시점 전에 만기가 오는 상품이 없어 가입 기간 제한 없이 확인할 수 있어요.";
  }
  return `${savedGoal.value.targetMonths}개월 안에 준비할 수 있도록 기간이 맞는 상품부터 보여드려요.`;
});
const resultTitle = computed(() =>
  savedGoal.value?.remainingAmount === 0
    ? "목표 금액만큼 준비했어요"
    : `한 달에 약 ${formatKoreanShortAmount(savedGoal.value?.monthlyReferenceAmount)}`,
);

function setForm(goal) {
  form.goalType = goal.goalType ?? "";
  form.customGoalName = goal.customGoalName ?? "";
  form.targetAmount = formatCurrencyInput(goal.targetAmount);
  form.targetMonths = String(goal.targetMonths ?? "");
  form.currentAmount = formatCurrencyInput(goal.currentAmount ?? 0);
}

function clearFormErrors() {
  Object.keys(errors).forEach((key) => delete errors[key]);
  errorMessage.value = "";
}

function handleEditGoal() {
  setForm(savedGoal.value);
  clearFormErrors();
  isEditing.value = true;
}

function handleCancelEdit() {
  setForm(savedGoal.value);
  clearFormErrors();
  isEditing.value = false;
}

async function loadGoal() {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const goal = await fetchFinancialGoal();
    if (goal) {
      savedGoal.value = goal;
      setForm(goal);
      isEditing.value = false;
    } else {
      isEditing.value = true;
    }
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : "목표를 불러오지 못했어요.";
  } finally {
    isLoading.value = false;
  }
}

function handleAmountInput(value) {
  form.targetAmount = formatCurrencyInput(value);
}

function handleCurrentAmountInput(value) {
  form.currentAmount = formatCurrencyInput(value);
}

function handleQuickMonths(months) {
  form.targetMonths = String(months);
  delete errors.targetMonths;
}

function validateForm() {
  Object.keys(errors).forEach((key) => delete errors[key]);
  errorMessage.value = "";
  const targetAmount = parseCurrencyInput(form.targetAmount);
  const currentAmount = parseCurrencyInput(form.currentAmount);
  const targetMonths = Number(form.targetMonths);

  if (!form.goalType) errors.goalType = "목표를 선택해 주세요.";
  if (isOtherGoal.value && !form.customGoalName.trim()) {
    errors.customGoalName = "목표 이름을 입력해 주세요.";
  }
  if (!targetAmount || targetAmount > MAX_GOAL_AMOUNT) {
    errors.targetAmount = "1원 이상 1조 원 이하로 입력해 주세요.";
  }
  if (currentAmount === null || currentAmount > MAX_GOAL_AMOUNT) {
    errors.currentAmount = "0원 이상 1조 원 이하로 입력해 주세요.";
  }
  if (
    !Number.isInteger(targetMonths) ||
    targetMonths < 1 ||
    targetMonths > MAX_GOAL_MONTHS
  ) {
    errors.targetMonths = "1개월 이상 600개월 이하로 입력해 주세요.";
  }
  const isValid = Object.keys(errors).length === 0;
  if (!isValid) {
    errorMessage.value = "입력한 내용을 다시 확인해 주세요.";
  }
  return isValid;
}

async function resolveSavedGoal(saveResponse) {
  if (saveResponse?.financialGoalId) return saveResponse;

  const loadedGoal = await fetchFinancialGoal();
  if (!loadedGoal) {
    throw new Error("저장한 목표를 확인하지 못했어요.");
  }
  return loadedGoal;
}

async function handleSubmit() {
  if (!validateForm()) return;
  isSaving.value = true;
  errorMessage.value = "";

  try {
    const saveResponse = await saveFinancialGoal({
      goalType: form.goalType,
      customGoalName: isOtherGoal.value ? form.customGoalName.trim() : null,
      targetAmount: parseCurrencyInput(form.targetAmount),
      currentAmount: parseCurrencyInput(form.currentAmount),
      targetMonths: Number(form.targetMonths),
    });
    savedGoal.value = await resolveSavedGoal(saveResponse);
    setForm(savedGoal.value);
    isEditing.value = false;
    await nextTick();
    resultCard.value?.$el?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError
        ? error.message
        : error.message || "목표를 저장하지 못했어요.";
  } finally {
    isSaving.value = false;
  }
}

async function handleDeleteGoal() {
  isDeleting.value = true;
  errorMessage.value = "";

  try {
    await deleteFinancialGoal();
    savedGoal.value = null;
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : "목표를 삭제하지 못했어요.";
    return;
  } finally {
    isDeleting.value = false;
  }

  await router.replace({ name: "my" });
}

function handleViewProducts() {
  const query = {
    tab: savedGoal.value.currentAmount === 0 ? "SAVING" : "DEPOSIT",
  };
  router.push({ name: "products", query });
}

onMounted(loadGoal);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <div class="grid grid-cols-[40px_1fr_40px] items-center">
        <BackButton />
        <h1 class="text-h1 text-center text-ink">목표에 맞는 상품 찾기</h1>
        <div aria-hidden="true"></div>
      </div>

      <BaseCard v-if="isLoading" color="white">
        <p class="text-body text-muted" role="status">저장한 목표를 확인하고 있어요.</p>
      </BaseCard>

      <template v-else>
        <BaseCard v-if="isEditing || !savedGoal" color="white">
          <form class="flex flex-col gap-6" @submit.prevent="handleSubmit">
            <div class="flex flex-col gap-2">
              <label for="goal-type" class="text-body font-semibold text-ink">
                무엇을 위해 준비하나요?
              </label>
              <select
                id="goal-type"
                v-model="form.goalType"
                class="rounded-2xl border border-line bg-white px-4 py-3 text-body text-ink outline-none focus:border-pink"
                :aria-invalid="Boolean(errors.goalType)"
              >
                <option value="" disabled>목표 선택</option>
                <option
                  v-for="goalType in FINANCIAL_GOAL_TYPES"
                  :key="goalType.value"
                  :value="goalType.value"
                >
                  {{ goalType.label }}
                </option>
              </select>
              <p v-if="errors.goalType" class="text-caption text-error" role="alert">
                {{ errors.goalType }}
              </p>
            </div>

            <BaseTextField
              v-if="isOtherGoal"
              id="custom-goal-name"
              v-model="form.customGoalName"
              label="목표 이름"
              placeholder="예: 반려동물 의료비"
              :maxlength="50"
              :error-message="errors.customGoalName"
            />

            <BaseTextField
              id="target-amount"
              :model-value="form.targetAmount"
              label="필요한 금액"
              placeholder="3,000,000"
              inputmode="numeric"
              trailing-text="원"
              :error-message="errors.targetAmount"
              @update:model-value="handleAmountInput"
            />

            <BaseTextField
              id="current-amount"
              :model-value="form.currentAmount"
              label="현재 마련한 금액"
              hint="이 목표를 위해 이미 마련해 둔 금액을 입력해 주세요."
              placeholder="0"
              inputmode="numeric"
              trailing-text="원"
              :error-message="errors.currentAmount"
              @update:model-value="handleCurrentAmountInput"
            />

            <div class="flex flex-col gap-4">
              <BaseTextField
                id="target-months"
                v-model="form.targetMonths"
                label="필요한 시점"
                placeholder="개월 수 입력"
                inputmode="numeric"
                trailing-text="개월"
                :error-message="errors.targetMonths"
              />
              <div class="grid grid-cols-3 gap-2" aria-label="목표 기간 빠른 선택">
                <button
                  v-for="months in QUICK_TARGET_MONTHS"
                  :key="months"
                  type="button"
                  :class="[
                    Number(form.targetMonths) === months
                      ? 'border-pink bg-pink-soft text-pink'
                      : 'border-line bg-white text-ink',
                    'rounded-2xl border px-4 py-3 text-button',
                  ]"
                  @click="handleQuickMonths(months)"
                >
                  {{ months }}개월
                </button>
              </div>
            </div>

            <p v-if="errorMessage" class="text-caption text-error" role="alert">
              {{ errorMessage }}
            </p>

            <div class="flex flex-col gap-2">
              <BottomButton
                type="button"
                color="pink"
                :disabled="isSaving"
                @click="handleSubmit"
              >
                {{
                  isSaving
                    ? "저장하는 중이에요"
                    : savedGoal
                      ? "수정 내용 저장하기"
                      : "저장하고 결과 보기"
                }}
              </BottomButton>
              <BottomButton
                v-if="savedGoal"
                type="button"
                color="white"
                :disabled="isSaving"
                @click="handleCancelEdit"
              >
                취소
              </BottomButton>
            </div>
          </form>
        </BaseCard>

        <BaseCard
          v-else-if="savedGoal"
          ref="resultCard"
          color="white"
          elevation="highlight"
        >
          <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
              <p class="text-caption text-pink">준비 중인 목표</p>
              <h2 class="text-h1 text-ink">{{ savedGoal.goalName }}</h2>
              <p class="text-caption text-muted tracking-tight">
                목표 {{ formatCurrency(savedGoal.targetAmount) }} ·
                {{ savedGoal.targetMonths }}개월
              </p>
            </div>

            <div class="flex flex-col gap-2 border-t border-line-soft pt-4">
              <p class="text-caption text-pink">계산 결과</p>
              <h3 class="text-h1 text-ink">{{ resultTitle }}</h3>
              <p class="text-caption text-muted tracking-tight">
                지금까지 {{ formatCurrency(savedGoal.currentAmount) }}을 준비했고,
                남은 금액은 {{ formatCurrency(savedGoal.remainingAmount) }}이에요.
              </p>
            </div>

            <div class="flex flex-col gap-2 border-t border-line-soft pt-4">
              <span class="text-caption text-muted">먼저 볼 상품</span>
              <strong class="text-body font-semibold text-ink">
                {{ recommendedProductSummary }}
              </strong>
              <p class="text-caption text-muted tracking-tight">
                {{ recommendationHint }}
              </p>
            </div>

            <p class="text-caption text-muted tracking-tight">
              월 금액은 이자를 제외하고 남은 금액을 기간으로 나눈 값이에요.
            </p>

            <BottomButton color="pink" @click="handleViewProducts">
              목표에 맞는 상품 보기
            </BottomButton>

            <p v-if="errorMessage" class="text-caption text-error" role="alert">
              {{ errorMessage }}
            </p>

            <div class="grid grid-cols-2 gap-2 border-t border-line-soft pt-4">
              <BottomButton color="white" @click="handleEditGoal">
                목표 수정하기
              </BottomButton>
              <BottomButton
                color="danger"
                :disabled="isDeleting"
                @click="isDeleteConfirmOpen = true"
              >
                {{ isDeleting ? "삭제하는 중이에요" : "목표 삭제" }}
              </BottomButton>
            </div>
          </div>
        </BaseCard>
      </template>
    </div>
  </PageContainer>

  <BaseModal
    v-model="isDeleteConfirmOpen"
    message="저장한 목표를 삭제할까요?"
    confirm-text="삭제하기"
    cancel-text="취소"
    @confirm="handleDeleteGoal"
  >
    <template #content>
      <p class="text-center text-caption text-muted tracking-tight">
        삭제하면 상품 목록에 목표기간 우선순위가 더 이상 반영되지 않아요.
      </p>
    </template>
  </BaseModal>
</template>
