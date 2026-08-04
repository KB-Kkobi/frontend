<script setup>
import { computed, reactive, ref } from "vue";

import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseInput from "@/components/common/BaseInput.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import {
  AGREEMENT_ITEMS,
  EMAIL_PATTERN,
  PASSWORD_PATTERN,
} from "@/constants/signup";

const form = reactive({
  email: "",
  password: "",
  nickname: "",
  birthDate: "",
});

const agreements = reactive(
  Object.fromEntries(AGREEMENT_ITEMS.map((item) => [item.id, false])),
);
const errors = reactive({
  email: "",
  password: "",
  nickname: "",
  birthDate: "",
  agreements: "",
});
const isAgreementOpen = ref(true);
const submitMessage = ref("");

const isAllAgreed = computed({
  get: () => AGREEMENT_ITEMS.every((item) => agreements[item.id]),
  set: (isChecked) => {
    AGREEMENT_ITEMS.forEach((item) => {
      agreements[item.id] = isChecked;
    });
  },
});

function resetErrors() {
  Object.keys(errors).forEach((key) => {
    errors[key] = "";
  });
}

function validateForm() {
  resetErrors();

  if (!EMAIL_PATTERN.test(form.email)) {
    errors.email = "올바른 이메일 주소를 입력해주세요.";
  }
  if (!PASSWORD_PATTERN.test(form.password)) {
    errors.password = "영문, 숫자, 특수문자를 포함해 8자 이상 입력해주세요.";
  }
  if (!form.nickname.trim()) {
    errors.nickname = "닉네임을 입력해주세요.";
  }
  if (!form.birthDate) {
    errors.birthDate = "생년월일을 선택해주세요.";
  }

  const hasRequiredAgreement = AGREEMENT_ITEMS.filter(
    (item) => item.required,
  ).every((item) => agreements[item.id]);

  if (!hasRequiredAgreement) {
    errors.agreements = "필수 약관에 모두 동의해주세요.";
  }

  return Object.values(errors).every((error) => !error);
}

function handleSubmit() {
  submitMessage.value = "";

  if (!validateForm()) {
    return;
  }

  submitMessage.value = "입력 정보가 확인되었습니다.";
}
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <BackButton />
        <div class="flex flex-col gap-2">
          <h1 class="text-h1 font-bold text-ink">회원가입</h1>
          <p class="text-body text-ink">
            결에 맞는 투자의 시작,<br />
            회원가입을 통해 시작해보세요!
          </p>
        </div>
      </div>

      <BaseCard color="white">
        <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
          <BaseInput
            id="signup-email"
            v-model="form.email"
            label="이메일"
            type="email"
            placeholder="이메일을 입력해주세요"
            autocomplete="email"
            inputmode="email"
            :error="errors.email"
            required
          />

          <BaseInput
            id="signup-password"
            v-model="form.password"
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력해주세요"
            autocomplete="new-password"
            hint="영문, 숫자, 특수문자 포함 8자 이상 입력해주세요"
            :error="errors.password"
            required
          />

          <BaseInput
            id="signup-nickname"
            v-model="form.nickname"
            label="닉네임"
            placeholder="닉네임을 입력해주세요"
            autocomplete="nickname"
            hint="다른 사용자에게 표시될 이름이에요"
            :error="errors.nickname"
            required
          />

          <BaseInput
            id="signup-birth-date"
            v-model="form.birthDate"
            label="생년월일"
            type="date"
            autocomplete="bday"
            hint="정확한 투자 정보를 제공받기 위해 필요해요"
            :error="errors.birthDate"
            required
          />

          <div class="flex flex-col gap-2">
            <div class="rounded-2xl bg-surface p-4">
              <div class="flex items-center gap-2">
                <label class="flex flex-1 items-center gap-2 text-body text-ink">
                  <input
                    v-model="isAllAgreed"
                    type="checkbox"
                    class="accent-yellow"
                  />
                  <span class="font-semibold">모두 동의합니다</span>
                </label>
                <button
                  type="button"
                  class="text-muted"
                  :aria-label="isAgreementOpen ? '약관 목록 접기' : '약관 목록 펼치기'"
                  :aria-expanded="isAgreementOpen"
                  @click="isAgreementOpen = !isAgreementOpen"
                >
                  <svg
                    class="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      :d="isAgreementOpen ? 'M6 9L12 15L18 9' : 'M9 6L15 12L9 18'"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div v-if="isAgreementOpen" class="flex flex-col gap-2">
                <label
                  v-for="item in AGREEMENT_ITEMS"
                  :key="item.id"
                  class="flex items-center gap-2 text-caption text-muted"
                >
                  <input
                    v-model="agreements[item.id]"
                    type="checkbox"
                    class="accent-yellow"
                  />
                  <span class="flex-1">{{ item.label }}</span>
                  <svg
                    class="h-6 w-6 text-ink"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M9 6L15 12L9 18"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </label>
              </div>
            </div>
            <p v-if="errors.agreements" class="text-caption text-error">
              {{ errors.agreements }}
            </p>
          </div>

          <BottomButton color="yellow" type="submit">
            회원가입 완료
          </BottomButton>

          <p
            v-if="submitMessage"
            class="text-center text-caption text-success"
            role="status"
          >
            {{ submitMessage }}
          </p>
        </form>
      </BaseCard>
    </div>
  </PageContainer>
</template>
