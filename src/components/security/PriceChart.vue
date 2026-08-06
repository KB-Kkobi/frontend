<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { CandlestickSeries, createChart } from "lightweight-charts";
import { fetchChart } from "@/api/stockApi";
import { CHART_COLORS, getChartPeriod } from "@/constants/chart";
import { formatDateBasic, getDateMonthsAgo } from "@/utils/date";

const props = defineProps({
  code: { type: String, required: true },
  period: { type: String, default: "D" },
});

const containerRef = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");
const hasData = ref(false);

const chart = shallowRef(null);
const candleSeries = shallowRef(null);
let resizeObserver = null;

function createChartInstance(container) {
  const instance = createChart(container, {
    layout: {
      background: { color: CHART_COLORS.background },
      textColor: CHART_COLORS.text,
      fontFamily: "Pretendard, system-ui, -apple-system, sans-serif",
      attributionLogo: false,
    },
    grid: {
      vertLines: { color: CHART_COLORS.grid },
      horzLines: { color: CHART_COLORS.grid },
    },
    rightPriceScale: {
      borderColor: CHART_COLORS.border,
    },
    timeScale: {
      borderColor: CHART_COLORS.border,
      timeVisible: false,
      fixLeftEdge: true,
      fixRightEdge: true,
      lockVisibleTimeRangeOnResize: true,
    },
    crosshair: {
      vertLine: { color: CHART_COLORS.text, width: 1 },
      horzLine: { color: CHART_COLORS.text, width: 1 },
    },
    localization: {
      locale: "ko-KR",
      priceFormatter: (price) => price.toLocaleString("ko-KR"),
    },
    autoSize: false,
    width: container.clientWidth,
    height: container.clientHeight,
  });

  const series = instance.addSeries(CandlestickSeries, {
    upColor: CHART_COLORS.up,
    downColor: CHART_COLORS.down,
    borderUpColor: CHART_COLORS.up,
    borderDownColor: CHART_COLORS.down,
    wickUpColor: CHART_COLORS.up,
    wickDownColor: CHART_COLORS.down,
  });

  return { instance, series };
}

function toCandleData(chartResponse) {
  if (!Array.isArray(chartResponse)) return [];
  return chartResponse.map((row) => ({
    time: row.date,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
  }));
}

async function loadChart() {
  if (!props.code || !candleSeries.value) return;

  const periodMeta = getChartPeriod(props.period);
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const to = new Date();
    const from = getDateMonthsAgo(periodMeta.monthsBack, to);
    const rows = await fetchChart(props.code, {
      period: periodMeta.key,
      from: formatDateBasic(from),
      to: formatDateBasic(to),
    });

    const data = toCandleData(rows);
    hasData.value = data.length > 0;
    candleSeries.value.setData(data);

    if (data.length > 0) chart.value?.timeScale().fitContent();
  } catch (err) {
    errorMessage.value = err?.message ?? "차트를 불러오지 못했습니다.";
    hasData.value = false;
    candleSeries.value.setData([]);
  } finally {
    isLoading.value = false;
  }
}

function handleResize() {
  if (!chart.value || !containerRef.value) return;
  chart.value.applyOptions({
    width: containerRef.value.clientWidth,
    height: containerRef.value.clientHeight,
  });
}

onMounted(() => {
  const container = containerRef.value;
  if (!container) return;

  const { instance, series } = createChartInstance(container);
  chart.value = instance;
  candleSeries.value = series;

  resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);

  loadChart();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;

  if (chart.value) {
    chart.value.remove();
    chart.value = null;
    candleSeries.value = null;
  }
});

watch(
  () => [props.code, props.period],
  () => {
    loadChart();
  },
);
</script>

<template>
  <div class="relative h-56 w-full overflow-hidden rounded-2xl bg-surface">
    <div ref="containerRef" class="h-full w-full" />

    <div
      v-if="isLoading"
      class="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <p class="text-caption text-muted">차트를 불러오는 중...</p>
    </div>

    <div
      v-else-if="errorMessage"
      class="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <p class="text-caption text-loss">{{ errorMessage }}</p>
    </div>

    <div
      v-else-if="!hasData"
      class="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <p class="text-caption text-muted">표시할 차트 데이터가 없습니다.</p>
    </div>
  </div>
</template>
