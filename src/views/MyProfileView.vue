<script setup>
import { onMounted, ref } from "vue";
import { fetchMyProfile, updateMyProfile } from "@/api/authApi";
import { ApiError } from "@/api/http";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseTextField from "@/components/common/BaseTextField.vue";
import BaseToast from "@/components/common/BaseToast.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import { formatLocalDate } from "@/utils/date";

const member = ref(null);
const nickname = ref("");
const birthDate = ref("");
const nicknameError = ref("");
const birthDateError = ref("");
const formError = ref("");
const errorMessage = ref("");
const isLoading = ref(true);
const isEditing = ref(false);
const isSubmitting = ref(false);
const isToastVisible = ref(false);

function formatBirthDateInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)]
    .filter(Boolean)
    .join(".");
}

function syncForm(profile) {
  nickname.value = profile?.nickname ?? "";
  birthDate.value = formatBirthDateInput(profile?.birthDate);
}

function clearFormErrors() {
  nicknameError.value = "";
  birthDateError.value = "";
  formError.value = "";
}

function validateForm() {
  const normalizedNickname = nickname.value.trim();
  const normalizedBirthDate = birthDate.value.replaceAll(".", "-");

  if (!normalizedNickname) {
    nicknameError.value = "닉네임을 입력해 주세요.";
  } else if (normalizedNickname.length > 30) {
    nicknameError.value = "닉네임은 30자 이하로 입력해 주세요.";
  }

  const parsedBirthDate = new Date(`${normalizedBirthDate}T00:00:00`);
  const [year, month, day] = normalizedBirthDate.split("-").map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isValidBirthDate = /^\d{4}-\d{2}-\d{2}$/.test(normalizedBirthDate)
    && !Number.isNaN(parsedBirthDate.getTime())
    && parsedBirthDate.getFullYear() === year
    && parsedBirthDate.getMonth() + 1 === month
    && parsedBirthDate.getDate() === day
    && parsedBirthDate < today;

  if (!isValidBirthDate) {
    birthDateError.value = "올바른 과거 생년월일을 입력해 주세요.";
  }

  return {
    isValid: !nicknameError.value && !birthDateError.value,
    nickname: normalizedNickname,
    birthDate: normalizedBirthDate,
  };
}

async function loadMember() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    member.value = await fetchMyProfile();
    syncForm(member.value);
  } catch (error) {
    errorMessage.value = error instanceof ApiError
      ? error.message
      : "회원 정보를 불러오지 못했어요.";
  } finally {
    isLoading.value = false;
  }
}

function handleStartEditing() {
  clearFormErrors();
  syncForm(member.value);
  isEditing.value = true;
}

function handleCancelEditing() {
  clearFormErrors();
  syncForm(member.value);
  isEditing.value = false;
}

async function handleSubmit() {
  if (isSubmitting.value) return;

  clearFormErrors();
  const profile = validateForm();
  if (!profile.isValid) return;

  isSubmitting.value = true;

  try {
    member.value = await updateMyProfile(profile);
    syncForm(member.value);
    isEditing.value = false;
    isToastVisible.value = true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      nicknameError.value = error.message;
    } else if (error instanceof ApiError && error.status === 400) {
      if (error.message.includes("닉네임")) {
        nicknameError.value = error.message;
      } else if (error.message.includes("생년월일")) {
        birthDateError.value = error.message;
      } else {
        formError.value = error.message;
      }
    } else {
      formError.value = error instanceof ApiError
        ? error.message
        : "프로필을 수정하지 못했어요. 잠시 후 다시 시도해 주세요.";
    }
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(loadMember);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <header class="grid grid-cols-3 items-center">
        <div class="justify-self-start">
          <BackButton />
        </div>
        <h1 class="justify-self-center whitespace-nowrap text-h1 text-ink">
          프로필
        </h1>
      </header>

      <p v-if="isLoading" class="text-center text-body text-muted" role="status">
        회원 정보를 불러오는 중이에요.
      </p>

      <BaseCard v-else-if="errorMessage" color="yellow">
        <div class="flex flex-col gap-4">
          <p class="text-body text-error" role="alert">{{ errorMessage }}</p>
          <BottomButton color="white" @click="loadMember">
            다시 시도
          </BottomButton>
        </div>
      </BaseCard>

      <BaseCard v-else color="white">
        <form v-if="isEditing" class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <div class="flex flex-col gap-2 border-b border-line-soft py-4">
            <span class="text-caption text-muted">이메일</span>
            <span class="break-all text-h2 text-ink">{{ member?.email || "-" }}</span>
          </div>

          <BaseTextField
            id="profile-nickname"
            v-model="nickname"
            label="닉네임"
            placeholder="닉네임을 입력해 주세요"
            autocomplete="nickname"
            icon="user"
            :maxlength="30"
            :error-message="nicknameError"
          />

          <BaseTextField
            id="profile-birth-date"
            :model-value="birthDate"
            label="생년월일"
            placeholder="2000.01.01"
            inputmode="numeric"
            :maxlength="10"
            autocomplete="bday"
            icon="calendar"
            :show-calendar-chevron="false"
            :error-message="birthDateError"
            @update:model-value="birthDate = formatBirthDateInput($event)"
          />

          <p v-if="formError" class="text-caption text-error" role="alert">
            {{ formError }}
          </p>

          <div class="flex gap-4">
            <BottomButton color="white" :disabled="isSubmitting" @click="handleCancelEditing">
              취소
            </BottomButton>
            <BottomButton type="submit" color="pink" :disabled="isSubmitting">
              {{ isSubmitting ? "저장 중" : "저장" }}
            </BottomButton>
          </div>
        </form>

        <div v-else class="flex flex-col gap-4">
          <dl class="flex flex-col">
            <div class="flex flex-col gap-2 border-b border-line-soft py-4">
              <dt class="text-caption text-muted">이메일</dt>
              <dd class="break-all text-h2 text-ink">{{ member?.email || "-" }}</dd>
            </div>

            <div class="flex flex-col gap-2 border-b border-line-soft py-4">
              <dt class="text-caption text-muted">닉네임</dt>
              <dd class="text-h2 text-ink">{{ member?.nickname || "-" }}</dd>
            </div>

            <div class="flex flex-col gap-2 py-4">
              <dt class="text-caption text-muted">생년월일</dt>
              <dd class="text-h2 tabular-nums text-ink">
                {{ formatLocalDate(member?.birthDate) }}
              </dd>
            </div>
          </dl>

          <BottomButton color="pink" @click="handleStartEditing">
            프로필 수정
          </BottomButton>
        </div>
      </BaseCard>
    </div>

    <BaseToast
      v-model="isToastVisible"
      title="프로필을 수정했어요."
      description="변경한 회원 정보가 저장되었습니다."
    />
  </PageContainer>
</template>
