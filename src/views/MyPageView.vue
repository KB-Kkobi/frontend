<script setup>
import { useRouter } from "vue-router";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import MyPageMenuCard from "@/components/mypage/MyPageMenuCard.vue";

const router = useRouter();

const ACTIVITY_ITEMS = [
  { id: "assessment", label: "내 성향 리포트", icon: "report" },
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

function handleMenuSelect(item) {
  console.log("마이페이지 메뉴:", item.id);
}

function handleLogout() {
  router.replace({ name: "login" });
}
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <h1 class="text-h1 text-ink">마이페이지</h1>

      <section class="flex flex-col gap-4">
        <h2 class="text-h2 text-muted">프로필 정보</h2>

        <BaseCard color="white">
          <button
            type="button"
            class="flex w-full items-center gap-4 text-left"
            @click="handleProfile"
          >
            <span class="rounded-full bg-yellow-soft p-4 text-yellow" aria-hidden="true">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.75" />
                <path d="M5 21C5 17.1 8.1 14 12 14C15.9 14 19 17.1 19 21" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
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
        <h2 class="text-h2 text-muted">내 활동</h2>
        <MyPageMenuCard :items="ACTIVITY_ITEMS" @select="handleMenuSelect" />
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="text-h2 text-muted">고객 지원</h2>
        <MyPageMenuCard :items="SUPPORT_ITEMS" @select="handleMenuSelect" />
      </section>

      <div class="flex items-center gap-4 px-4">
        <span class="rounded-2xl bg-white p-4 text-yellow" aria-hidden="true">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <path d="M4 17L10 11L14 15L21 7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M15 7H21V13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <strong class="min-w-0 flex-1 text-body font-semibold text-ink">앱 버전 정보</strong>
        <span class="text-caption text-muted tabular-nums">v1.0.0</span>
      </div>

      <BottomButton color="yellow" @click="handleLogout">
        로그아웃
      </BottomButton>
    </div>
  </PageContainer>
</template>
