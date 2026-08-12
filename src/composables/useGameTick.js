import { computed, onUnmounted, ref } from 'vue';

function normalizeTick({ tick, month, marketIndex, price, changeRate }) {
  return { tick, month, marketIndex, price, changeRate };
}

export function useGameTick() {
  const ticks = ref([]);
  const tickIntervalMs = ref(0);
  const currentTickIndex = ref(0);
  let intervalId = null;

  const currentTick = computed(
    () => ticks.value[currentTickIndex.value] ?? null,
  );
  const visibleTicks = computed(() =>
    ticks.value.slice(0, currentTickIndex.value + 1),
  );

  const totalTickCount = computed(() => ticks.value.length);
  const priceMin = computed(() => {
    if (ticks.value.length === 0) return 0;
    return Math.min(...ticks.value.map((t) => t.price));
  });
  const priceMax = computed(() => {
    if (ticks.value.length === 0) return 0;
    return Math.max(...ticks.value.map((t) => t.price));
  });

  function stop() {
    if (intervalId === null) return;
    clearInterval(intervalId);
    intervalId = null;
  }

  function runInterval() {
    intervalId = setInterval(() => {
      if (currentTickIndex.value >= ticks.value.length - 1) {
        stop();
        return;
      }
      currentTickIndex.value += 1;
    }, tickIntervalMs.value);
  }

  function start(scenario) {
    stop();

    ticks.value = scenario.ticks.map(normalizeTick);
    tickIntervalMs.value = scenario.tickIntervalMs;
    currentTickIndex.value = 0;

    if (ticks.value.length <= 1) return;

    runInterval();
  }

  function restore(scenario, tickIndex) {
    stop();

    ticks.value = scenario.ticks.map(normalizeTick);
    tickIntervalMs.value = scenario.tickIntervalMs;
    currentTickIndex.value = Math.min(
      Math.max(tickIndex, 0),
      Math.max(ticks.value.length - 1, 0),
    );
  }

  function pause() {
    stop();
  }

  function resume() {
    if (intervalId !== null) return;
    if (ticks.value.length <= 1) return;
    if (currentTickIndex.value >= ticks.value.length - 1) return;
    runInterval();
  }

  function resumeAfterDelay(delayMs) {
    stop();
    if (ticks.value.length <= 1) return;
    if (currentTickIndex.value >= ticks.value.length - 1) return;

    intervalId = setTimeout(() => {
      intervalId = null;
      currentTickIndex.value += 1;
      if (currentTickIndex.value >= ticks.value.length - 1) return;
      runInterval();
    }, delayMs);
  }

  onUnmounted(stop);

  return {
    currentTick,
    visibleTicks,
    currentTickIndex,
    totalTickCount,
    priceMin,
    priceMax,
    start,
    restore,
    stop,
    pause,
    resume,
    resumeAfterDelay,
  };
}
