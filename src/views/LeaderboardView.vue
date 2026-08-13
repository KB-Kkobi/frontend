<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { fetchFriendLeaderboard, fetchPersonaLeaderboard } from "@/api/leaderboardApi";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import TabBar from "@/components/common/TabBar.vue";
import LeaderboardRankRow from "@/components/leaderboard/LeaderboardRankRow.vue";

// ── 상수 ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "persona", label: "성향끼리" },
  { key: "friends", label: "친구끼리" },
];
const LOAD_ERROR_MESSAGE = "리더보드를 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
const FETCHERS = {
  persona: fetchPersonaLeaderboard,
  friends: fetchFriendLeaderboard,
};

// ── 반응형 상태 ───────────────────────────────────────────────────────────────
const activeTab = ref("persona");
// 탭별로 데이터를 따로 캐싱해, 재조회 중에는 직전 데이터를 그대로 보여준다.
const tabStates = reactive({
  persona: { data: null, hasLoaded: false, isLoading: false, errorMessage: "" },
  friends: { data: null, hasLoaded: false, isLoading: false, errorMessage: "" },
});

// ── computed ─────────────────────────────────────────────────────────────────
const currentState = computed(() => tabStates[activeTab.value]);
const rankings = computed(() =>
  Array.isArray(currentState.value.data?.rankings) ? currentState.value.data.rankings : [],
);
const myRank = computed(() => currentState.value.data?.myRank ?? null);
const personaId = computed(() => currentState.value.data?.personaId ?? null);
const personaName = computed(() => currentState.value.data?.personaName ?? null);
const isPersonaTab = computed(() => activeTab.value === "persona");
const showPersonaEmptyState = computed(() => isPersonaTab.value && !personaId.value);
const showFriendsEmptyNotice = computed(
  () => !isPersonaTab.value && rankings.value.length <= 1,
);

// ── 데이터 조회 ──────────────────────────────────────────────────────────────
async function loadTab(tabKey) {
  const state = tabStates[tabKey];
  const isFirstLoad = !state.hasLoaded;
  if (isFirstLoad) state.isLoading = true;
  state.errorMessage = "";

  try {
    const response = await FETCHERS[tabKey]();
    state.data = response ?? null;
    state.hasLoaded = true;
  } catch {
    // 서버 메시지 대신 고정 안내 문구를 사용한다.
    state.errorMessage = LOAD_ERROR_MESSAGE;
  } finally {
    state.isLoading = false;
  }
}

// ── watch ─────────────────────────────────────────────────────────────────────
watch(activeTab, (tabKey) => {
  loadTab(tabKey);
});

// ── lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  loadTab(activeTab.value);
});
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <PageHeader
        title="리더보드"
        description="나와 비슷한 금융 성향의 사용자 또는 친구들과 투자 성과를 비교해보세요."
      />

      <TabBar v-model="activeTab" :tabs="TABS" />

      <!-- 최초 로딩 -->
      <BaseCard v-if="currentState.isLoading" color="white">
        <p class="text-caption text-muted" role="status">
          리더보드를 불러오는 중이에요...
        </p>
      </BaseCard>

      <!-- 에러 -->
      <BaseCard v-else-if="currentState.errorMessage" color="white" elevation="flat">
        <div class="flex flex-col gap-4" role="alert">
          <p class="text-caption text-muted">{{ currentState.errorMessage }}</p>
          <BottomButton color="white" @click="loadTab(activeTab)">
            다시 시도하기
          </BottomButton>
        </div>
      </BaseCard>

      <template v-else>
        <!-- 성향 진단 전: 성향끼리 탭 빈 상태 -->
        <BaseCard v-if="showPersonaEmptyState" color="white" elevation="flat">
          <div class="flex flex-col gap-2">
            <p class="text-body text-muted tracking-tight">
              아직 확인할 수 있는 성향 리더보드가 없어요.
            </p>
            <p class="text-caption text-muted tracking-tight">
              금융 성향 분석을 완료하면 나와 비슷한 사용자들과 비교할 수 있어요.
            </p>
          </div>
        </BaseCard>

        <template v-else>
          <!-- 성향끼리 탭 요약 -->
          <BaseCard v-if="isPersonaTab" color="white" elevation="highlight">
            <div class="flex flex-col items-center gap-2 text-center">
              <p class="text-h2 text-ink">{{ personaName }}끼리 비교하고 있어요</p>
              <p class="text-caption text-muted">현재 나는 {{ myRank }}위예요</p>
            </div>
          </BaseCard>

          <!-- 친구끼리 탭: 친구 없음 안내 (본인 데이터는 아래 목록에 계속 표시) -->
          <BaseCard v-if="showFriendsEmptyNotice" color="white" elevation="flat">
            <p class="text-body text-muted tracking-tight">
              아직 함께 비교할 친구가 없어요.
            </p>
          </BaseCard>

          <!-- 순위 목록 -->
          <div v-if="rankings.length" class="flex flex-col gap-4">
            <LeaderboardRankRow
              v-for="item in rankings"
              :key="item.userId ?? item.rank"
              :rank="item.rank"
              :nickname="item.nickname"
              :persona-name="item.personaName"
              :total-asset="item.totalAsset"
              :return-rate="item.returnRate"
              :is-me="item.rank === myRank"
            />
          </div>
        </template>
      </template>
    </div>
  </PageContainer>
</template>
