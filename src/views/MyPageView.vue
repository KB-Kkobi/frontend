<script setup>
import { useRouter } from "vue-router";
import { logoutUser } from "@/api/authApi";
import BaseCard from "@/components/common/BaseCard.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import MyPageMenuCard from "@/components/mypage/MyPageMenuCard.vue";
import { useAuthStore } from "@/stores/auth";
import { clearGameSession } from "@/utils/gameStorage";

const router = useRouter();
const authStore = useAuthStore();

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
  console.log("프로필 정보");
}

function handleAssessmentSelect() {
  router.push({ name: "assessment-result" });
}

function handleFriendSelect() {
  router.push({ name: "friend-management" });
}

function handleMenuSelect(item) {
  console.log("마이페이지 메뉴:", item.id);
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

</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <PageHeader title="마이페이지" />

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
              <strong class="text-h2 text-ink">꼬비</strong>
              <span class="text-caption text-muted">불꽃 추격자</span>
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
        <h2 class="text-h2 text-ink">친구</h2>
        <MyPageMenuCard :items="FRIEND_ITEMS" @select="handleFriendSelect" />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="text-h2 text-ink">설정</h2>
        <MyPageMenuCard :items="SETTING_ITEMS" @select="handleMenuSelect" />
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
