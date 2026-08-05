<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseTextField from "@/components/common/BaseTextField.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";

const router = useRouter();

const email = ref("");
const password = ref("");
const emailError = ref("");
const passwordError = ref("");
const formError = ref("");
const isSubmitting = ref(false);

function clearErrors() {
  emailError.value = "";
  passwordError.value = "";
  formError.value = "";
}

async function handleLogin() {
  if (isSubmitting.value) return;

  clearErrors();
  isSubmitting.value = true;

  const loginData = {
    email: email.value,
    password: password.value,
  };

  try {
    console.log("로그인 요청 데이터:", loginData);

    // 실제 API 연동 시 아래 대기 코드를 login API 호출로 교체합니다.
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    if (error.response?.status === 400 && error.response.data?.fieldErrors) {
      emailError.value = error.response.data.fieldErrors.email ?? "";
      passwordError.value = error.response.data.fieldErrors.password ?? "";
    } else {
      formError.value =
        error.response?.data?.message ??
        "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.";
    }
  } finally {
    isSubmitting.value = false;
  }
}

function handleFindPassword() {
  router.push({ name: "password-reset" });
}

function handleSignup() {
  router.push({ name: "signup" });
}
</script>

<template>
  <PageContainer>
    <div class="flex flex-1 flex-col gap-6 py-6">
      <div
        class="flex flex-1 items-center justify-center"
        aria-label="서비스 로고 영역"
      ></div>

      <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
        <BaseCard color="white">
          <div class="flex flex-col gap-4">
            <BaseTextField
              id="login-email"
              v-model="email"
              label="이메일"
              type="email"
              placeholder="이메일을 입력해주세요"
              autocomplete="email"
              inputmode="email"
              icon="email"
              :error-message="emailError"
            />

            <BaseTextField
              id="login-password"
              v-model="password"
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력해주세요"
              autocomplete="current-password"
              icon="password"
              :error-message="passwordError"
            />

            <div class="flex justify-end">
              <button
                type="button"
                class="text-caption text-muted"
                @click="handleFindPassword"
              >
                비밀번호 찾기 ›
              </button>
            </div>

            <p v-if="formError" class="text-caption text-error" role="alert">
              {{ formError }}
            </p>

            <BottomButton type="submit" color="yellow" :disabled="isSubmitting">
              {{ isSubmitting ? "로그인 중" : "로그인" }}
            </BottomButton>
          </div>
        </BaseCard>

        <BottomButton color="white" @click="handleSignup">
          회원가입 ›
        </BottomButton>
      </form>
    </div>
  </PageContainer>
</template>
