<script setup>
import { onMounted, ref } from "vue";
import {
  fetchNotificationSettings,
  updateNotificationSettings,
} from "@/api/notificationApi";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseSwitch from "@/components/common/BaseSwitch.vue";
import BaseToast from "@/components/common/BaseToast.vue";
import PageContainer from "@/components/common/PageContainer.vue";

const settings = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");
const isToastVisible = ref(false);
const isSaving = ref(false);

async function loadSettings() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    settings.value = await fetchNotificationSettings();
  } catch {
    settings.value = null;
    errorMessage.value = "알림 설정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
  } finally {
    isLoading.value = false;
  }
}

async function handleToggle(field, value) {
  // 한 요청이 끝나기 전엔 다른 toggle 요청이 겹치지 않도록 막는다 — 늦게 도착한 응답이
  // 그 사이에 바뀐 최신 값을 덮어쓰는 race condition을 원천 차단한다.
  if (isSaving.value) return;

  const previous = settings.value[field];
  settings.value[field] = value;
  isSaving.value = true;

  try {
    const updated = await updateNotificationSettings({ [field]: value });
    settings.value.tradeEnabled = updated.tradeEnabled;
    settings.value.friendEnabled = updated.friendEnabled;
  } catch {
    settings.value[field] = previous;
    isToastVisible.value = true;
  } finally {
    isSaving.value = false;
  }
}

// row 전체를 눌러도 토글되도록 — 스위치 자체를 눌렀을 땐 스위치의 자체 클릭이 이미 처리하므로
// 이 핸들러까지 다시 겹쳐 호출되지 않게 스위치 쪽에서 클릭 전파를 막는다(@click.stop).
function handleRowClick(field) {
  if (isSaving.value) return;
  handleToggle(field, !settings.value[field]);
}

onMounted(loadSettings);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <header class="flex items-center gap-2">
        <BackButton />
        <h1 class="text-h1 text-ink">알림 설정</h1>
      </header>

      <BaseCard v-if="isLoading" color="white" elevation="flat">
        <p class="text-caption text-muted" role="status">설정을 불러오는 중이에요...</p>
      </BaseCard>

      <BaseCard v-else-if="errorMessage" color="white" elevation="flat">
        <p class="text-caption text-muted" role="alert">{{ errorMessage }}</p>
      </BaseCard>

      <BaseCard v-else-if="settings" color="white" elevation="flat">
        <div class="flex flex-col">
          <div
            role="button"
            tabindex="0"
            class="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl py-3 transition-colors active:bg-surface"
            @click="handleRowClick('tradeEnabled')"
            @keydown.enter.prevent="handleRowClick('tradeEnabled')"
            @keydown.space.prevent="handleRowClick('tradeEnabled')"
          >
            <span class="shrink-0 text-muted" aria-hidden="true">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M4 5V19H20" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M7 15L10.5 11.5L13.5 14L19 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <div class="flex min-w-0 flex-1 flex-col gap-1">
              <span class="text-body font-semibold text-ink">거래 알림</span>
              <span class="text-caption text-muted">주식 매수·매도 체결 알림을 받아요</span>
            </div>
            <BaseSwitch
              :model-value="settings.tradeEnabled"
              :disabled="isSaving"
              class="shrink-0"
              @click.stop
              @update:model-value="(value) => handleToggle('tradeEnabled', value)"
            />
          </div>

          <div class="border-t border-line-soft" />

          <div
            role="button"
            tabindex="0"
            class="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl py-3 transition-colors active:bg-surface"
            @click="handleRowClick('friendEnabled')"
            @keydown.enter.prevent="handleRowClick('friendEnabled')"
            @keydown.space.prevent="handleRowClick('friendEnabled')"
          >
            <span class="shrink-0 text-muted" aria-hidden="true">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.75" />
                <path d="M3 20C3 16.7 5.7 14 9 14C12.3 14 15 16.7 15 20" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
                <path d="M16 5.5C17.7 5.8 19 7.3 19 9C19 10.7 17.7 12.2 16 12.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
                <path d="M17 14.3C19.4 14.8 21 16.9 21 20" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
              </svg>
            </span>
            <div class="flex min-w-0 flex-1 flex-col gap-1">
              <span class="text-body font-semibold text-ink">친구 알림</span>
              <span class="text-caption text-muted">친구 신청 및 수락 알림을 받아요</span>
            </div>
            <BaseSwitch
              :model-value="settings.friendEnabled"
              :disabled="isSaving"
              class="shrink-0"
              @click.stop
              @update:model-value="(value) => handleToggle('friendEnabled', value)"
            />
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseToast
      v-model="isToastVisible"
      title="알림 설정 변경에 실패했어요."
      offset="header"
      variant="error"
    />
  </PageContainer>
</template>
