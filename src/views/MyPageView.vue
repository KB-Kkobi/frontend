<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { fetchMyProfile, logoutUser } from "@/api/authApi";
import { fetchFinancialGoal } from "@/api/financialGoalApi";
import BaseCard from "@/components/common/BaseCard.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import MyPageMenuCard from "@/components/mypage/MyPageMenuCard.vue";
import NotificationBellButton from "@/components/notification/NotificationBellButton.vue";
import { useAuthStore } from "@/stores/auth";
import { clearGameSession } from "@/utils/gameStorage";
import { formatKoreanShortAmount } from "@/utils/format";

const router = useRouter();
const authStore = useAuthStore();
const nickname = ref("");
const isProfileLoading = ref(true);
const financialGoal = ref(null);
const isFinancialGoalLoading = ref(true);

const REPORT_ITEMS = [
  { id: "assessment-report", label: "내 성향 리포트 보기", icon: "report" },
];

const FRIEND_ITEMS = [
  { id: "friend-management", label: "친구 관리", icon: "friend" },
];

const SETTING_ITEMS = [
  { id: "notifications", label: "알림 설정", icon: "notification" },
];

const SUPPORT_ITEMS = [
  { id: "notices", label: "공지사항 · 이벤트", icon: "notice" },
  { id: "support", label: "고객센터 · FAQ · 문의하기", icon: "support" },
  { id: "policies", label: "약관 · 개인정보처리방침", icon: "policy" },
];

function handleProfile() {
  router.push({ name: "my-profile" });
}

async function loadProfile() {
  isProfileLoading.value = true;

  try {
    const profile = await fetchMyProfile();
    nickname.value = profile?.nickname ?? "";
  } catch {
    nickname.value = "";
  } finally {
    isProfileLoading.value = false;
  }
}

async function loadFinancialGoal() {
  isFinancialGoalLoading.value = true;
  try {
    financialGoal.value = await fetchFinancialGoal();
  } catch {
    financialGoal.value = null;
  } finally {
    isFinancialGoalLoading.value = false;
  }
}

function handleAssessmentSelect() {
  router.push({ name: "assessment-result" });
}

function handleFinancialGoal() {
  router.push({ name: "financial-goal" });
}

function handleFriendSelect() {
  router.push({ name: "friend-management" });
}

function handleMenuSelect(item) {
  console.log("마이페이지 메뉴:", item.id);
}

function handleSettingSelect(item) {
  if (item.id === "notifications") {
    router.push({ name: "notification-settings" });
    return;
  }
  handleMenuSelect(item);
}

async function handleLogout() {
  try {
    await logoutUser();
  } finally {
    clearGameSession();
    authStore.logout();
    await router.replace({ name: "login" });
  }
}

onMounted(() => {
  loadProfile();
  loadFinancialGoal();
});
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <PageHeader title="마이페이지">
        <template #actions>
          <NotificationBellButton />
        </template>
      </PageHeader>

      <section>
        <BaseCard color="white">
          <button
            type="button"
            class="flex w-full items-center gap-4 text-left"
            @click="handleProfile"
          >
            <span class="rounded-full bg-white p-4 text-muted" aria-hidden="true">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="currentColor" />
                <path d="M5 21C5 17.1 8.1 14 12 14C15.9 14 19 17.1 19 21V21H5Z" fill="currentColor" />
              </svg>
            </span>

            <span class="flex min-w-0 flex-1 flex-col gap-2">
              <strong class="block truncate text-h2 text-ink">
                {{ isProfileLoading ? "불러오는 중..." : nickname || "사용자" }}
              </strong>
              <span class="text-caption text-muted">프로필 관리</span>
            </span>

            <svg
              class="h-6 w-6 shrink-0 text-muted"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </BaseCard>
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="text-h2 text-ink">투자 성향</h2>
        <MyPageMenuCard :items="REPORT_ITEMS" @select="handleAssessmentSelect" />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="text-h2 text-ink">준비 중인 목표</h2>
        <BaseCard color="white" elevation="flat">
          <button
            type="button"
            class="flex w-full items-center gap-4 text-left"
            @click="handleFinancialGoal"
          >
            <span class="flex min-w-0 flex-1 flex-col gap-2">
              <strong class="text-body font-semibold text-ink">
                <template v-if="isFinancialGoalLoading">목표를 확인하고 있어요</template>
                <template v-else-if="financialGoal">{{ financialGoal.goalName }}</template>
                <template v-else>아직 정한 목표가 없어요</template>
              </strong>
              <span class="text-caption text-muted">
                <template v-if="financialGoal">
                  {{ formatKoreanShortAmount(financialGoal.currentAmount) }} 준비 · 목표 {{ formatKoreanShortAmount(financialGoal.targetAmount) }}
                </template>
                <template v-else>필요한 금액과 시기를 정해둘 수 있어요.</template>
              </span>
            </span>
            <span class="shrink-0 text-caption font-semibold text-pink">
              {{ financialGoal ? "수정" : "정하기" }}
            </span>
          </button>
        </BaseCard>
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="text-h2 text-ink">친구</h2>
        <MyPageMenuCard :items="FRIEND_ITEMS" @select="handleFriendSelect" />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="text-h2 text-ink">설정</h2>
        <MyPageMenuCard :items="SETTING_ITEMS" @select="handleSettingSelect" />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="text-h2 text-ink">고객지원</h2>
        <MyPageMenuCard :items="SUPPORT_ITEMS" @select="handleMenuSelect" />
      </section>

      <button
        type="button"
        class="flex items-center justify-center gap-2 px-4 py-3 text-button text-error"
        @click="handleLogout"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M10 5H5V19H10M14 8L18 12L14 16M8 12H18" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        로그아웃
      </button>
    </div>
  </PageContainer>
</template>
