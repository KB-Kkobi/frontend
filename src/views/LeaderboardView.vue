<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { fetchMyInfo } from "@/api/authApi";
import { fetchFriendLeaderboard, fetchPersonaLeaderboard } from "@/api/leaderboardApi";
import { fetchPersonas } from "@/api/personaApi";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import TabBar from "@/components/common/TabBar.vue";
import LeaderboardPersonaSummaryCard from "@/components/leaderboard/LeaderboardPersonaSummaryCard.vue";
import LeaderboardRankRow from "@/components/leaderboard/LeaderboardRankRow.vue";
import NotificationBellButton from "@/components/notification/NotificationBellButton.vue";
import { LEADERBOARD_SORT_DEFAULT, LEADERBOARD_SORT_OPTIONS } from "@/constants/leaderboard";

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
// 리더보드 응답에는 imagePath가 없어 성향 목록에서 한 번만 찾아 캐싱한다.
const personaImagePath = ref(null);
const loadedImagePersonaId = ref(null);
// 동순위(rank 동률)가 존재할 수 있어 myRank 대신 userId로 내 행을 판별한다.
const myUserId = ref(null);
// 정렬 기준은 탭을 옮겨도 유지한다(성향끼리 ↔ 친구끼리 공용 상태).
const selectedSort = ref(LEADERBOARD_SORT_DEFAULT);

// ── computed ─────────────────────────────────────────────────────────────────
const currentState = computed(() => tabStates[activeTab.value]);
const rankings = computed(() =>
  Array.isArray(currentState.value.data?.rankings) ? currentState.value.data.rankings : [],
);
// 서버가 내려준 원본 myRank(기본 정렬 기준). isMyRow의 폴백 판별에만 쓰인다.
const serverMyRank = computed(() => currentState.value.data?.myRank ?? null);
// 정렬 기준에 따라 다시 정렬하고, 화면 표시용 순위(rank)도 그 결과 기준으로
// 새로 매긴다. 서버가 내려준 rank는 정렬 전 기준값이라 그대로 쓰지 않고
// serverRank로 보존해 isMyRow 폴백 판별에 사용한다.
// 정렬 키가 동일한 값이 있으면(Array.prototype.sort는 안정 정렬) 서버 응답
// 순서를 그대로 유지한다.
const sortedRankings = computed(() => {
  const sortKey = selectedSort.value === "returnRate" ? "returnRate" : "totalAsset";
  return [...rankings.value]
    .sort((a, b) => Number(b?.[sortKey] ?? 0) - Number(a?.[sortKey] ?? 0))
    .map((item, index) => ({ ...item, serverRank: item.rank, rank: index + 1 }));
});
// 정렬 결과 기준으로 내 순위를 다시 찾는다(userId 기준 판별, myRank 고정값 사용 안 함).
const myRank = computed(() => {
  const index = sortedRankings.value.findIndex((item) => isMyRow(item));
  return index !== -1 ? index + 1 : serverMyRank.value;
});
const personaId = computed(() => currentState.value.data?.personaId ?? null);
const personaName = computed(() => currentState.value.data?.personaName ?? null);
const isPersonaTab = computed(() => activeTab.value === "persona");
const showPersonaEmptyState = computed(() => isPersonaTab.value && !personaId.value);
// 나를 제외한 비교 대상이 없을 때만 친구 없음 안내를 보여준다.
const otherRankings = computed(() => rankings.value.filter((item) => !isMyRow(item)));
const showFriendsEmptyNotice = computed(
  () => !isPersonaTab.value && otherRankings.value.length === 0,
);
const participantCount = computed(() => rankings.value.length);

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

// 내 행 판별용 userId. 실패해도 순위 비교로 대체되므로 화면 흐름을 막지 않는다.
async function loadMyUserId() {
  try {
    const info = await fetchMyInfo();
    myUserId.value = info?.userId ?? null;
  } catch {
    myUserId.value = null;
  }
}

// 수익률이 같으면 서버가 동순위를 부여하므로(assignRanks) userId로 내 행을 판별한다.
// 내 정보를 못 받아온 경우에만 서버 원본 순위 비교로 대체한다(동순위면 중복 표시될 수 있음).
// myRank computed는 이 함수 결과에 의존하므로, 여기서는 myRank가 아니라
// serverMyRank(원본 값)만 참조해 순환 참조를 만들지 않는다.
function isMyRow(item) {
  const rowUserId = item?.userId ?? null;
  if (myUserId.value !== null && rowUserId !== null) {
    return rowUserId === myUserId.value;
  }
  const originalRank = item?.serverRank ?? item?.rank ?? null;
  return serverMyRank.value !== null && originalRank === serverMyRank.value;
}

// 성향 이미지는 보조 시각 요소이므로 실패해도 화면 흐름을 막지 않는다.
async function loadPersonaImage(targetPersonaId) {
  if (!targetPersonaId || loadedImagePersonaId.value === targetPersonaId) return;
  loadedImagePersonaId.value = targetPersonaId;

  try {
    const personas = await fetchPersonas();
    const matched = Array.isArray(personas)
      ? personas.find((persona) => persona.personaId === targetPersonaId)
      : null;
    personaImagePath.value = matched?.imagePath ?? null;
  } catch {
    personaImagePath.value = null;
  }
}

// ── watch ─────────────────────────────────────────────────────────────────────
watch(activeTab, (tabKey) => {
  loadTab(tabKey);
});

watch(personaId, (nextPersonaId) => {
  if (nextPersonaId) loadPersonaImage(nextPersonaId);
});

// ── lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  loadTab(activeTab.value);
  loadMyUserId();
});
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <PageHeader
        title="리더보드"
        description="나와 비슷한 금융 성향의 사용자 또는 친구들과 투자 성과를 비교해보세요."
      >
        <template #actions>
          <NotificationBellButton />
        </template>
      </PageHeader>

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
          <LeaderboardPersonaSummaryCard
            v-if="isPersonaTab"
            :persona-name="personaName"
            :image-path="personaImagePath"
            :my-rank="myRank"
            :participant-count="participantCount"
          />

          <!-- 친구끼리 탭: 친구 없음 안내 (본인 데이터는 아래 목록에 계속 표시) -->
          <BaseCard v-if="showFriendsEmptyNotice" color="white" elevation="flat">
            <p class="text-body text-muted tracking-tight">
              아직 함께 비교할 친구가 없어요.
            </p>
          </BaseCard>

          <!-- 순위 목록 -->
          <div v-if="rankings.length" class="flex flex-col gap-2">
            <div class="flex items-center justify-between px-4">
              <span class="text-caption text-muted tracking-tight">순위</span>
              <label
                class="relative flex cursor-pointer items-center gap-2 text-caption text-ink"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M8 18V6m0 0L5 9m3-3 3 3M16 6v12m0 0 3-3m-3 3-3-3"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>
                  {{
                    LEADERBOARD_SORT_OPTIONS.find(
                      (option) => option.value === selectedSort,
                    )?.label
                  }}
                </span>
                <select
                  v-model="selectedSort"
                  class="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="리더보드 정렬"
                >
                  <option
                    v-for="option in LEADERBOARD_SORT_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
            </div>

            <div class="flex flex-col gap-4">
              <LeaderboardRankRow
                v-for="item in sortedRankings"
                :key="item.userId ?? item.rank"
                :rank="item.rank"
                :nickname="item.nickname"
                :persona-name="isPersonaTab ? null : item.personaName"
                :total-asset="item.totalAsset"
                :return-rate="item.returnRate"
                :is-me="isMyRow(item)"
              />
            </div>
          </div>
        </template>
      </template>
    </div>
  </PageContainer>
</template>
