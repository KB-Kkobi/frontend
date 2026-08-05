<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { fetchScenario } from "@/api/gameApi";
import { ApiError } from "@/api/http";
import PageContainer from "@/components/common/PageContainer.vue";
import GameEventPopup from "@/components/game/GameEventPopup.vue";
import MarketIndexCard from "@/components/game/MarketIndexCard.vue";
import { DEFAULT_SCENARIO_ID } from "@/constants/game";
import { useGameTick } from "@/composables/useGameTick";

const {
  currentTick,
  visibleTicks,
  totalTickCount,
  priceMin,
  priceMax,
  start,
  pause,
  resume,
} = useGameTick();

const isLoading = ref(true);
const errorMessage = ref("");
const eventsByTick = ref(new Map());
const shownEventTicks = ref(new Set());
const activeEvent = ref(null);
const bannerEvent = ref(null);

const prices = computed(() => visibleTicks.value.map((tick) => tick.price));

function buildEventsByTick(events) {
  return new Map(
    events.map(({ tick, tag, tagTone, summary, description }) => [
      tick,
      { tag, tagTone, summary, description },
    ]),
  );
}

async function loadScenario() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const scenario = await fetchScenario(DEFAULT_SCENARIO_ID);
    eventsByTick.value = buildEventsByTick(scenario.events);
    start(scenario);
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError
        ? error.message
        : "시나리오를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isLoading.value = false;
  }
}

function handleCloseEvent() {
  bannerEvent.value = activeEvent.value;
  activeEvent.value = null;
  resume();
}

watch(currentTick, (tick) => {
  if (!tick) return;
  if (shownEventTicks.value.has(tick.tick)) return;

  const event = eventsByTick.value.get(tick.tick);
  if (!event) return;

  shownEventTicks.value.add(tick.tick);
  activeEvent.value = event;
  pause();
});

onMounted(loadScenario);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-4 py-6">
      <p v-if="isLoading" class="text-caption text-muted">불러오는 중...</p>
      <p v-else-if="errorMessage" class="text-caption text-error" role="alert">
        {{ errorMessage }}
      </p>
      <template v-else>
        <MarketIndexCard
          :current-tick="currentTick"
          :prices="prices"
          :total-ticks="totalTickCount"
          :price-min="priceMin"
          :price-max="priceMax"
          :banner-event="bannerEvent"
        />
        <GameEventPopup
          :event="activeEvent"
          :visible="!!activeEvent"
          @close="handleCloseEvent"
        />
      </template>
    </div>
  </PageContainer>
</template>