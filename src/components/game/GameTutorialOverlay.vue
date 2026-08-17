<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import GameTutorialCard from "@/components/game/GameTutorialCard.vue";

// target 주변에 남길 여백(px). 스포트라이트 구멍과 링 계산에 공용으로 쓴다.
const SPOTLIGHT_PADDING = 8;
// 매수/매도 주문 카드 전체를 강조할 때는 카드 외곽선에 최대한 맞춰야 해서
// 일반 대상보다 훨씬 좁은 여백을 쓴다.
const CARD_SPOTLIGHT_PADDING = 4;
const CARD_TARGET_KEYS = new Set([
  "buy-order-card",
  "sell-order-card",
  "deposit-cancel-card",
  "asset-panel",
]);
// 스포트라이트 구멍의 모서리를 링(rounded-2xl)과 동일하게 둥글려서, 딤 컷아웃이
// 각진 사각형으로 보이며 대상 요소 바깥 배경까지 하얗게 노출되는 것을 막는다.
const SPOTLIGHT_RADIUS = 16;
const DOCK_BASE_OFFSET = 32;
// 튜토리얼 카드와 강조 대상(특히 열려 있는 주문 시트) 사이 최소 시각적 간격.
const DOCK_SHEET_GAP = 20;
const DOCK_TOP_MARGIN = 12;
const DOCK_POSITION_EPSILON = 1;
// 시트를 밀어올리는 최대치. 이보다 더 필요하면(극단적으로 짧은 화면) 그 이상은
// 도크 쪽 clamp에 맡겨 시트가 화면 위로 어색하게 붕 뜨는 것을 막는다.
const MAX_SHEET_LIFT_PX = 160;

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  imageScale: {
    type: Number,
    default: 1,
  },
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    required: true,
  },
  // "start" = 첫 인사 화면 전용 연출(꼬비 큼직하게 겹침 배치 + 등장 애니메이션).
  // "compact"(기본) = 게임 화면 위 스포트라이트 가이드용 좌측 하단 도크.
  variant: {
    type: String,
    default: "compact",
    validator: (v) => ["compact", "start"].includes(v),
  },
  // data-tutorial-target 속성값(들). 문자열 하나 또는 여러 개를 동시에 강조하고
  // 싶으면 배열로 전달한다. 비어있으면 스포트라이트 없이 대화창만 띄운다.
  target: {
    type: [String, Array],
    default: null,
  },
  // target이 카드 전체처럼 "보여주기용" 넓은 영역일 때, 실제 클릭 프록시는
  // 이 값(예: 실제 버튼) 위에만 만든다. 비어있으면 target과 동일하게 취급한다
  // (기존 동작 — 강조 대상 자체가 곧 클릭 대상인 경우).
  interactionTarget: {
    type: String,
    default: null,
  },
  // 튜토리얼 진행 중 항상 노출하는 우측 상단 건너뛰기 동작.
  skipLabel: {
    type: String,
    default: "",
  },
  showPrev: {
    type: Boolean,
    default: false,
  },
  prevDisabled: {
    type: Boolean,
    default: false,
  },
  // 비어있지 않으면 이전/다음 내비게이션 버튼을 보여준다.
  nextLabel: {
    type: String,
    default: "",
  },
  // 비어있지 않으면 단일 확인 버튼을 보여준다(내비게이션과 배타적).
  confirmLabel: {
    type: String,
    default: "",
  },
  // 다음 행동 조건을 기다리는 "관찰" 전환 단계용. 일반 가이드보다 가볍게
  // 표시한다 — 꼬비 라벨·짧은 문구만 보여주고 진행 표시를 덧붙인다.
  lightweight: {
    type: Boolean,
    default: false,
  },
  // 강조 대상 없이 화면 세로 중앙 쪽에 가깝게(완전 중앙은 아님) 대화창을 띄우고
  // 싶을 때. lightweight의 "관찰 중" 표시는 없이 위치만 중앙 쪽으로 옮긴다.
  centerDock: {
    type: Boolean,
    default: false,
  },
  // 도크를 target 기준으로 자동 배치("auto")하거나 아래("bottom")/위("top")를
  // 우선한다. 지정한 쪽이 target을 가리거나 화면을 벗어나면 반대쪽으로 이동한다.
  placement: {
    type: String,
    default: "auto",
    validator: (v) => ["auto", "top", "bottom"].includes(v),
  },
  // 관찰 단계에서는 가격 tick이 바뀔 때마다 같은 포커스에서 pulse를 한 번 재생한다.
  focusPulse: {
    type: Boolean,
    default: false,
  },
  pulseKey: {
    type: [String, Number],
    default: "",
  },
  // 가격 관찰처럼 대상 영역을 조용히 바라보는 단계는 일반 행동 유도보다
  // 링과 배경 대비를 약하게 표시한다.
  spotlightVariant: {
    type: String,
    default: "default",
    validator: (v) => ["default", "observe"].includes(v),
  },
  // true인 단계에서만 현재 target 위에 투명 클릭 프록시를 만든다. 그 외 배경은
  // interaction blocker가 모두 가로채므로 튜토리얼 흐름 밖의 버튼은 동작하지 않는다.
  allowInteraction: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["prev", "next", "confirm", "skip"]);

const targetKeys = computed(() => {
  if (!props.target) return [];
  return Array.isArray(props.target) ? props.target.filter(Boolean) : [props.target];
});

// interactionTarget이 없으면 기존처럼 강조 대상 자체가 클릭 대상이다.
const interactionKeys = computed(() =>
  props.interactionTarget ? [props.interactionTarget] : targetKeys.value,
);

const targetRectMap = ref({}); // { [target key]: DOMRect | null }
const overlayEl = ref(null);
const overlayRect = ref(null);
// 매수/매도 BottomSheet가 열려 있으면 그 위로 안 가리게
// 대화창을 시트 상단 위로 띄운다.
const dialogRect = ref(null);
// 도크(꼬비+말풍선) 자체 높이. 위로 띄울 때 화면 위로 잘리지 않게 클램프하는 데 쓴다.
const dockEl = ref(null);
const dockHeightPx = ref(0);
// Spotlight 측정값과 분리한 실제 표시 좌표. 새 target을 준비하는 동안에도 이전
// 좌표를 유지하고, 새 좌표가 완성된 시점에만 한 번 갱신한다.
const stableDockTopPx = ref(null);
// 한 step에서 선택한 target 위/아래 방향을 유지해 경계값 근처의 반복 반전을 막는다.
const stablePlacementSide = ref(null);
let rafId = null;
let measurementGeneration = 0;
let watchStatusIntervalId = null;
const watchDotCount = ref(1);

function measureOverlay() {
  overlayRect.value = overlayEl.value?.getBoundingClientRect() ?? null;
}

function measureTarget() {
  const map = {};
  const keys = new Set([...targetKeys.value, ...interactionKeys.value]);
  for (const key of keys) {
    const el = document.querySelector(`[data-tutorial-target="${key}"]`);
    map[key] = el ? el.getBoundingClientRect() : null;
  }
  targetRectMap.value = map;
}

function measureDialog() {
  const el = document.querySelector('[role="dialog"][aria-modal="true"]');
  dialogRect.value = el ? el.getBoundingClientRect() : null;
}

function measureDock() {
  if (dockEl.value) dockHeightPx.value = dockEl.value.offsetHeight;
}

function trackFrame(generation) {
  if (generation !== measurementGeneration) return;
  measureOverlay();
  measureTarget();
  measureDialog();
  measureDock();
  updateStableDockPosition();
  rafId = requestAnimationFrame(() => trackFrame(generation));
}

function stopTracking() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
}

function startTracking(generation) {
  if (generation !== measurementGeneration) return;
  stopTracking();
  measureOverlay();
  measureTarget();
  measureDialog();
  measureDock();
  updateStableDockPosition();
  rafId = requestAnimationFrame(() => trackFrame(generation));
}

function waitForRenderFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function isElementFullyVisible(el) {
  const rect = el.getBoundingClientRect();
  if (
    rect.top < DOCK_TOP_MARGIN ||
    rect.left < 0 ||
    rect.bottom > window.innerHeight - DOCK_TOP_MARGIN ||
    rect.right > window.innerWidth
  ) {
    return false;
  }

  let ancestor = el.parentElement;
  while (ancestor && ancestor !== document.body) {
    const { overflowX, overflowY } = window.getComputedStyle(ancestor);
    const clipsX = ["auto", "scroll", "hidden", "clip"].includes(overflowX);
    const clipsY = ["auto", "scroll", "hidden", "clip"].includes(overflowY);

    if (clipsX || clipsY) {
      const ancestorRect = ancestor.getBoundingClientRect();
      if (
        (clipsX && (rect.left < ancestorRect.left || rect.right > ancestorRect.right)) ||
        (clipsY && (rect.top < ancestorRect.top || rect.bottom > ancestorRect.bottom))
      ) {
        return false;
      }
    }
    ancestor = ancestor.parentElement;
  }

  return true;
}

async function prepareTargets(visible, generation) {
  if (!visible) return;

  await nextTick();
  if (generation !== measurementGeneration) return;

  // Teleport된 BottomSheet/Popup과 도크 높이를 먼저 반영한다. sheetLiftPx가
  // 바뀌는 경우 한 프레임 렌더한 뒤 최종 target 위치를 확인한다.
  measureOverlay();
  measureDialog();
  measureDock();
  await nextTick();
  await waitForRenderFrame();
  if (generation !== measurementGeneration) return;

  const firstKey = targetKeys.value[0];
  const firstTarget = firstKey
    ? document.querySelector(`[data-tutorial-target="${firstKey}"]`)
    : null;

  // 이미 보이는 대상에는 스크롤을 전혀 적용하지 않는다. Popup 안쪽처럼 실제로
  // 잘린 대상만 가장 가까운 위치로 즉시 이동시켜 링이 화면을 따라 끌려가지 않게 한다.
  if (firstTarget && !isElementFullyVisible(firstTarget)) {
    firstTarget.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
    await waitForRenderFrame();
    if (generation !== measurementGeneration) return;
  }

  startTracking(generation);
}

function stopWatchStatus() {
  if (watchStatusIntervalId !== null) clearInterval(watchStatusIntervalId);
  watchStatusIntervalId = null;
}

function startWatchStatus() {
  stopWatchStatus();
  watchDotCount.value = 1;
  watchStatusIntervalId = setInterval(() => {
    watchDotCount.value = (watchDotCount.value % 3) + 1;
  }, 360);
}

// target이 바뀌면 Spotlight 좌표는 같은 프레임에 먼저 비우되, 대화창의 stable top은
// 유지한다. 새 target·콘텐츠 높이가 모두 준비된 뒤에만 다음 top으로 갱신한다.
watch(
  () => [
    props.visible,
    targetKeys.value.join("|"),
    props.interactionTarget,
    props.centerDock,
    props.placement,
    props.variant,
    props.title,
    props.message,
    props.showPrev,
    props.nextLabel,
    props.confirmLabel,
    props.lightweight,
  ],
  (nextValues, previousValues) => {
    const [visible, targetSignature, interactionTarget] = nextValues;
    const targetChanged =
      !previousValues ||
      targetSignature !== previousValues[1] ||
      interactionTarget !== previousValues[2];
    const generation = ++measurementGeneration;
    stopTracking();
    if (targetChanged) targetRectMap.value = {};
    stablePlacementSide.value = null;
    void prepareTargets(visible, generation);
  },
  { immediate: true, flush: "sync" },
);

// 현재 실제로 측정된(존재하는) 대상들만.
const activeEntries = computed(() =>
  targetKeys.value
    .map((key) => ({ key, rect: targetRectMap.value[key] ?? null }))
    .filter((entry) => entry.rect),
);

// 클릭 프록시 전용 — target이 카드 전체여도 실제 클릭은 interactionTarget
// (예: 실제 버튼) 위에만 만들어야 클릭이 의미 있게 동작한다.
const interactionEntries = computed(() =>
  interactionKeys.value
    .map((key) => ({ key, rect: targetRectMap.value[key] ?? null }))
    .filter((entry) => entry.rect),
);

watch(
  () => props.visible && props.lightweight,
  (isWatching) => {
    if (isWatching) {
      startWatchStatus();
      return;
    }
    stopWatchStatus();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopTracking();
  stopWatchStatus();
});

function activeGeometry(rect, key) {
  const overlay = overlayRect.value;
  const padding = CARD_TARGET_KEYS.has(key) ? CARD_SPOTLIGHT_PADDING : SPOTLIGHT_PADDING;
  const overlayLeft = overlay?.left ?? 0;
  const overlayTop = overlay?.top ?? 0;
  const overlayWidth = overlay?.width ?? window.innerWidth;
  const overlayHeight = overlay?.height ?? window.innerHeight;
  const x = Math.max(0, rect.left - overlayLeft - padding);
  const y = Math.max(0, rect.top - overlayTop - padding);
  const right = Math.min(overlayWidth, rect.right - overlayLeft + padding);
  const bottom = Math.min(overlayHeight, rect.bottom - overlayTop + padding);

  return {
    x,
    y,
    width: Math.max(0, right - x),
    height: Math.max(0, bottom - y),
  };
}

function interactionGeometry(rect) {
  const overlay = overlayRect.value;
  return {
    x: rect.left - (overlay?.left ?? 0),
    y: rect.top - (overlay?.top ?? 0),
    width: rect.width,
    height: rect.height,
  };
}

// 현재 DOM에서 실제로 측정된 대상만 그린다. 이전 위치 fallback을 두지 않아
// activeEntries가 비는 순간 Spotlight도 즉시 사라진다.
const maskEntries = computed(() =>
  activeEntries.value.map((entry) => ({
    key: entry.key,
    isCard: CARD_TARGET_KEYS.has(entry.key),
    geo: activeGeometry(entry.rect, entry.key),
  })),
);

// 구멍의 네 모서리를 SPOTLIGHT_RADIUS만큼 둥글린 path를 만든다. 각진 사각형 구멍을
// 그대로 뚫으면 링(rounded-2xl)과 모양이 어긋나 대상 요소 바깥 배경까지 하얗게
// 노출돼 "하얀 네모"로 보이는 문제가 있었다 — 구멍 자체를 링과 같은 반경으로 둥글린다.
function roundedRectPath(x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  if (r <= 0) return `M${x},${y}H${x + width}V${y + height}H${x}Z`;
  return (
    `M${x + r},${y}` +
    `H${x + width - r}A${r},${r} 0 0 1 ${x + width},${y + r}` +
    `V${y + height - r}A${r},${r} 0 0 1 ${x + width - r},${y + height}` +
    `H${x + r}A${r},${r} 0 0 1 ${x},${y + height - r}` +
    `V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`
  );
}

// 딤 배경은 SVG mask 대신 evenodd fill-rule 패스 하나로 그린다. mask(luminance/alpha)는
// 브라우저마다 구현이 갈려 구멍이 안 뚫리는 경우가 있었는데, evenodd는 그런 모호함 없이
// "바깥 사각형 - 구멍 사각형들"을 그대로 뺄셈해준다. (구멍의 d는 애니메이션되지 않지만,
// 별도로 그리는 링은 여전히 transition으로 부드럽게 움직인다.)
const dimPathD = computed(() => {
  const w = overlayRect.value?.width ?? window.innerWidth;
  const h = overlayRect.value?.height ?? window.innerHeight;
  let d = `M0,0H${w}V${h}H0Z`;
  for (const entry of maskEntries.value) {
    const { x, y, width, height } = entry.geo;
    if (width <= 0 || height <= 0) continue;
    d += ` ${roundedRectPath(x, y, width, height, SPOTLIGHT_RADIUS)}`;
  }
  return d;
});

// 일반 HTML 링 <div>는 top/left 좌표계를 쓴다.
function htmlGeoStyle(geo) {
  return {
    top: `${geo.y}px`,
    left: `${geo.x}px`,
    width: `${geo.width}px`,
    height: `${geo.height}px`,
  };
}

function combinedTargetRect(entries) {
  if (entries.length === 0) return null;
  const rects = entries.map((entry) => entry.rect);
  return {
    top: Math.min(...rects.map((rect) => rect.top)),
    bottom: Math.max(...rects.map((rect) => rect.bottom)),
  };
}

function choosePlacementSide(target, dockHeight, viewportHeight) {
  const viewportBottom = viewportHeight - DOCK_BASE_OFFSET;
  const spaceAbove = target.top - DOCK_SHEET_GAP - DOCK_TOP_MARGIN;
  const spaceBelow = viewportBottom - target.bottom - DOCK_SHEET_GAP;
  const canFitAbove = spaceAbove >= dockHeight;
  const canFitBelow = spaceBelow >= dockHeight;

  if (props.placement === "top") {
    return canFitAbove || !canFitBelow ? "top" : "bottom";
  }
  if (props.placement === "bottom") {
    return canFitBelow || !canFitAbove ? "bottom" : "top";
  }
  if (canFitAbove !== canFitBelow) return canFitAbove ? "top" : "bottom";
  return spaceBelow >= spaceAbove ? "bottom" : "top";
}

function clampDockTop(top, viewportHeight, dockHeight) {
  const maxTop = Math.max(
    DOCK_TOP_MARGIN,
    viewportHeight - DOCK_BASE_OFFSET - dockHeight,
  );
  return Math.min(Math.max(top, DOCK_TOP_MARGIN), maxTop);
}

// center/default/target 위·아래를 모두 overlay 기준 top 좌표 하나로 환산한다.
// target이 필요한 단계에서 새 측정값이 아직 없다면 null을 반환해 기존 stable top을
// 그대로 유지한다. dialogRect는 시트 lift 계산에만 쓰고 dock fallback에는 쓰지 않는다.
function calculateDockTop() {
  const dockHeight = dockHeightPx.value;
  const overlay = overlayRect.value;
  const viewportHeight = overlay?.height ?? window.innerHeight;
  if (!dockHeight || !viewportHeight) return null;

  if (props.centerDock) {
    return clampDockTop(
      (viewportHeight - dockHeight) / 2,
      viewportHeight,
      dockHeight,
    );
  }

  const targetRect = combinedTargetRect(activeEntries.value);
  if (targetKeys.value.length > 0 && !targetRect) return null;

  if (!targetRect) {
    return clampDockTop(
      viewportHeight - DOCK_BASE_OFFSET - dockHeight,
      viewportHeight,
      dockHeight,
    );
  }

  const overlayTop = overlay?.top ?? 0;
  const localTarget = {
    top: targetRect.top - overlayTop,
    bottom: targetRect.bottom - overlayTop,
  };
  if (!stablePlacementSide.value) {
    stablePlacementSide.value = choosePlacementSide(
      localTarget,
      dockHeight,
      viewportHeight,
    );
  }

  const desiredTop =
    stablePlacementSide.value === "top"
      ? localTarget.top - DOCK_SHEET_GAP - dockHeight
      : localTarget.bottom + DOCK_SHEET_GAP;
  return clampDockTop(desiredTop, viewportHeight, dockHeight);
}

function updateStableDockPosition() {
  const nextTop = calculateDockTop();
  if (nextTop === null) return;
  if (
    stableDockTopPx.value === null ||
    Math.abs(stableDockTopPx.value - nextTop) >= DOCK_POSITION_EPSILON
  ) {
    stableDockTopPx.value = nextTop;
  }
}

// 도크(튜토리얼 카드)가 열려 있는 시트 위에 최소 간격(DOCK_SHEET_GAP)을 두고
// 들어갈 자리가 화면에 자연스럽게(= 시트를 안 움직여도) 나오는지 확인하고,
// 부족하면 그 부족분만큼 시트 자체를 들어올린다. dialogRect.height/dockHeightPx는
// "위치"가 아니라 "고유 콘텐츠 높이"라서 리프트 값이 매 프레임 자기 자신을
// 다시 밀어올리는 피드백 루프 없이 한 번에 안정적으로 계산된다.
const sheetLiftPx = computed(() => {
  const dialog = dialogRect.value;
  if (!dialog || !dockHeightPx.value) return 0;
  const neededSpaceAboveSheet = dockHeightPx.value + DOCK_SHEET_GAP + DOCK_TOP_MARGIN;
  const naturalSpaceAboveSheet = window.innerHeight - dialog.height;
  const deficit = neededSpaceAboveSheet - naturalSpaceAboveSheet;
  if (deficit <= 0) return 0;
  return Math.min(deficit, MAX_SHEET_LIFT_PX);
});

// 부모가 BottomSheet/Popup/Modal을 열거나 닫기 직전에 명시적으로 호출한다.
// 진행 중인 RAF 세대까지 취소하므로 다음 프레임에 이전 target이 재측정되지 않는다.
function clearSpotlight() {
  measurementGeneration += 1;
  stopTracking();
  targetRectMap.value = {};
}

defineExpose({ sheetLiftPx, clearSpotlight });

// wrapper는 항상 top: 0에 두고 translateY 하나만 애니메이션한다. 최초 좌표가
// 준비되기 전에는 숨겨 0px에서 화면 안으로 이동하는 가짜 전환도 노출하지 않는다.
const dockStyle = computed(() => ({
  transform: `translateY(${stableDockTopPx.value ?? 0}px)`,
  visibility: stableDockTopPx.value === null ? "hidden" : "visible",
}));

const watchStatusText = computed(
  () => `지켜보는 중${".".repeat(watchDotCount.value)}`,
);

function spotlightKey(entry) {
  return props.focusPulse
    ? `${entry.key}-${props.pulseKey}`
    : entry.key;
}

function handleAllowedInteraction(targetKey) {
  if (!props.allowInteraction) return;
  const target = document.querySelector(
    `[data-tutorial-target="${targetKey}"]`,
  );
  target?.click();
}

function getOverlayButtons() {
  if (!overlayEl.value) return [];
  return [...overlayEl.value.querySelectorAll('button:not(:disabled)')];
}

// 실제 매수/매도 시트가 열려 있으면 그 시트도 "보호 영역"에 포함시킨다 — 그렇지
// 않으면 오버레이 밖(다른 Teleport 서브트리)인 시트 내부 입력(수량 타이핑 등)이
// 이 전역 캡처 리스너에 의해 전부 preventDefault되어 버린다.
function isInsideProtectedArea(target) {
  if (overlayEl.value?.contains(target)) return true;
  const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
  return !!dialog?.contains(target);
}

function handleTutorialKeydown(event) {
  if (!props.visible || !overlayEl.value) return;

  const isInsideOverlay = isInsideProtectedArea(event.target);
  if (event.key !== 'Tab') {
    if (!isInsideOverlay || event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    return;
  }

  const openDialog = document.querySelector('[role="dialog"][aria-modal="true"]');
  if (openDialog?.contains(document.activeElement)) return;

  const buttons = getOverlayButtons();
  if (buttons.length === 0) {
    event.preventDefault();
    return;
  }

  const currentIndex = buttons.indexOf(document.activeElement);
  const isLeavingStart = event.shiftKey && currentIndex <= 0;
  const isLeavingEnd = !event.shiftKey && currentIndex === buttons.length - 1;
  if (!isInsideOverlay || currentIndex === -1 || isLeavingStart || isLeavingEnd) {
    event.preventDefault();
    const nextIndex = event.shiftKey ? buttons.length - 1 : 0;
    buttons[nextIndex].focus();
  }
}

onMounted(() => window.addEventListener('keydown', handleTutorialKeydown, true));

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleTutorialKeydown, true);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="overlayEl"
      class="pointer-events-none fixed inset-y-0 left-1/2 z-[60] w-full max-w-[430px] -translate-x-1/2 text-ink"
    >
        <!-- 어두운 배경 + 스포트라이트 구멍(들): 실제 게임 화면은 그대로 두고
             지금 설명 중인 대상만 밝게 뚫어 보여준다. fill-opacity는 이 SVG에만
             적용되므로 뒤쪽 게임 화면이나 안내 카드의 opacity에는 영향을 주지 않는다. -->
        <svg class="absolute inset-0 z-0 h-full w-full" aria-hidden="true">
          <path
            :d="dimPathD"
            fill="currentColor"
            :fill-opacity="spotlightVariant === 'observe' ? 0.48 : 0.6"
            fill-rule="evenodd"
          />
        </svg>

        <!-- 딤의 시각 표현과 별개인 실제 입력 차단 레이어. 실제 매수/매도 시트가 열려
             있을 때는(dialogRect) 그 시트 자신의 백드롭이 배경 클릭을 이미 막고 있으므로
             이 레이어는 비활성화한다 — 그래야 시트 내부(수량 입력·스테퍼·제출 버튼)가
             실제로 조작 가능해진다. -->
        <div
          :class="[
            'absolute inset-0 z-10',
            dialogRect ? 'pointer-events-none' : 'pointer-events-auto',
          ]"
          aria-hidden="true"
        ></div>

        <button
          v-if="skipLabel"
          type="button"
          class="pointer-events-auto absolute right-5 top-6 z-30 text-caption text-muted underline"
          @click="emit('skip')"
        >
          {{ skipLabel }}
        </button>

        <!-- Spotlight에는 leave 전환을 두지 않는다. target 교체 시 이전 링은 즉시
             제거하고, 같은 target의 좌표 변화만 transition-all로 부드럽게 이동한다. -->
        <div class="absolute inset-0 z-20">
          <div
            v-for="entry in maskEntries"
            :key="spotlightKey(entry)"
            :class="[
              'absolute rounded-2xl transition-all duration-300 ease-out',
              entry.isCard
                ? 'ring-2 ring-pink/50'
                : spotlightVariant === 'observe'
                  ? 'ring-2 ring-pink/30'
                  : ['ring-4 ring-pink/40', focusPulse ? 'animate-tutorial-observe' : 'animate-tutorial-focus-in'],
            ]"
            :style="htmlGeoStyle(entry.geo)"
          ></div>
        </div>

        <button
          v-for="entry in allowInteraction ? interactionEntries : []"
          :key="`interaction-${entry.key}`"
          type="button"
          class="pointer-events-auto absolute z-30 bg-transparent"
          :style="htmlGeoStyle(interactionGeometry(entry.rect))"
          :aria-label="`${entry.key} 튜토리얼 동작`"
          @click="handleAllowedInteraction(entry.key)"
        ></button>

        <!-- 꼬비 + 말풍선 도크: 모든 단계가 같은 top 기준 translateY 좌표를 쓴다.
             새 target 측정 중에는 이전 stable 좌표를 유지하고, 준비된 새 좌표로만
             한 번 이동한다. -->
        <div
          ref="dockEl"
          class="pointer-events-none absolute inset-x-0 top-0 z-40 transition-transform duration-300 ease-out"
          :style="dockStyle"
        >
          <div class="mx-auto w-full max-w-[430px] px-4">
            <GameTutorialCard
              :image="image"
              :image-scale="imageScale"
              :variant="variant"
              :title="title"
              :message="message"
              :show-prev="showPrev"
              :prev-disabled="prevDisabled"
              :next-label="nextLabel"
              :confirm-label="confirmLabel"
              :lightweight="lightweight"
              :watch-status-text="watchStatusText"
              @prev="emit('prev')"
              @next="emit('next')"
              @confirm="emit('confirm')"
            />
          </div>
        </div>
    </div>
  </Teleport>
</template>
