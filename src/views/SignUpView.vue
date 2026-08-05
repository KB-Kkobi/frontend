<script setup>
import { ref } from "vue";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseTextField from "@/components/common/BaseTextField.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";

const email = ref("");
const password = ref("");
const nickname = ref("");
const birthDate = ref("");

const emailError = ref("");
const passwordError = ref("");
const nicknameError = ref("");
const birthDateError = ref("");
const formError = ref("");
const isSubmitting = ref(false);

function clearErrors() {
  emailError.value = "";
  passwordError.value = "";
  nicknameError.value = "";
  birthDateError.value = "";
  formError.value = "";
}

function applyFieldErrors(fieldErrors = {}) {
  emailError.value = fieldErrors.email ?? "";
  passwordError.value = fieldErrors.password ?? "";
  nicknameError.value = fieldErrors.nickname ?? "";
  birthDateError.value = fieldErrors.birthDate ?? "";
}

async function handleSignup() {
  if (isSubmitting.value) return;

  clearErrors();
  isSubmitting.value = true;

  const signupData = {
    email: email.value,
    password: password.value,
    nickname: nickname.value,
    birthDate: birthDate.value,
  };

  try {
    console.log("회원가입 요청 데이터:", signupData);

    // 실제 API 연동 시 아래 대기 코드를 signup API 호출로 교체 예정
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    if (error.response?.status === 400 && error.response.data?.fieldErrors) {
      applyFieldErrors(error.response.data.fieldErrors);
    } else {
      formError.value =
        error.response?.data?.message ??
        "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.";
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <PageContainer>
    <form class="flex flex-col gap-6 py-6" @submit.prevent="handleSignup">
      <header class="flex flex-col gap-6">
        <div>
          <BackButton />
        </div>
        <h1 class="text-h1 text-ink">회원가입</h1>
      </header>

      <BaseCard color="white">
        <div class="flex flex-col gap-4">
          <BaseTextField
            id="signup-email"
            v-model="email"
            label="이메일"
            type="email"
            placeholder="이메일을 입력해주세요"
            autocomplete="email"
            inputmode="email"
            :error-message="emailError"
          />

          <BaseTextField
            id="signup-password"
            v-model="password"
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력해주세요"
            hint="영문, 숫자, 특수문자 포함 8자 이상 입력해주세요"
            autocomplete="new-password"
            :error-message="passwordError"
          />

          <BaseTextField
            id="signup-nickname"
            v-model="nickname"
            label="닉네임"
            placeholder="닉네임을 입력해주세요"
            hint="다른 사용자에게 표시될 이름이에요"
            autocomplete="nickname"
            :error-message="nicknameError"
          />

          <BaseTextField
            id="signup-birth-date"
            v-model="birthDate"
            label="생년월일"
            type="date"
            hint="정확한 투자 정보를 제공받기 위해 필요해요"
            autocomplete="bday"
            :error-message="birthDateError"
          />

          <p v-if="formError" class="text-caption text-error" role="alert">
            {{ formError }}
          </p>

          <BottomButton type="submit" color="yellow" :disabled="isSubmitting">
            {{ isSubmitting ? "회원가입 처리 중" : "회원가입 완료" }}
          </BottomButton>
        </div>
      </BaseCard>
    </form>
  </PageContainer>
</template>
