import { computed, onUnmounted, ref } from "vue";
import { fetchQuote } from "@/api/trade";
import { subscribeTick, onConnectionChange, onError } from "@/api/stockSocket";
import {
  PRICE_FEED_STATUS,
  PRICE_FEED_MAX_RECONNECT_ATTEMPTS,
} from "@/constants/trade";

/**
 * 실시간 시세 composable.
 *
 * - 초기값은 REST fetchQuote 로 채우고, 이후 갱신은 STOMP 소켓으로 수신합니다.
 * - previousClose 는 장중 불변. 소켓 payload 에 없으면 REST 값을 유지합니다.
 * - 소켓 연결 끊김 시 재연결 후 REST 를 한 번 재조회해 공백을 메웁니다.
 * - 재연결 실패가 MAX_RECONNECT_ATTEMPTS 를 초과하면 status 가 'failed' 로 전환됩니다.
 *   단, 주문 기능은 막지 않습니다(status 는 표시 전용).
 * - 화면 이탈(onUnmounted) 시 구독을 해제합니다.
 *
 * 주의: 소켓 가격은 표시 전용입니다. 시장가 주문의 실제 체결가는 서버가 주문 시점에
 * 다시 조회하므로 화면 값과 다를 수 있습니다. 주문 검증에 소켓 가격을 신뢰하지 마세요.
 *
 * @param {{ securityId: number, ticker: string }} params
 *   securityId — REST fetchQuote 에 사용하는 숫자 ID
 *   ticker     — STOMP 구독 토픽 /topic/stocks/{ticker} 에 사용하는 종목코드 문자열
 */
export function usePriceFeed({ securityId, ticker }) {
  // ── 노출 상태 ────────────────────────────────────────────────────────────
  const currentPrice = ref(null);
  const previousClose = ref(null);
  const changeAmount = ref(null);
  const changeRate = ref(null);
  const status = ref(PRICE_FEED_STATUS.RECONNECTING);
  const lastUpdatedAt = ref(null);

  // ── 내부 상태 ────────────────────────────────────────────────────────────
  let reconnectAttempts = 0;
  let isDestroyed = false;
  let offConnectionChange = null;
  let offError = null;
  let unsubscribeTick = null;

  // ── computed ─────────────────────────────────────────────────────────────
  const isConnected = computed(() => status.value === PRICE_FEED_STATUS.CONNECTED);
  const isReconnecting = computed(() => status.value === PRICE_FEED_STATUS.RECONNECTING);
  const isFailed = computed(() => status.value === PRICE_FEED_STATUS.FAILED);

  // ── REST 조회 ─────────────────────────────────────────────────────────────
  async function loadRestQuote() {
    if (isDestroyed) return;
    try {
      const data = await fetchQuote(securityId);
      if (isDestroyed) return;

      currentPrice.value = data.currentPrice ?? currentPrice.value;
      // previousClose 는 장중 불변 — 최초 REST 값을 유지하되, 아직 없을 때만 덮어씀
      if (previousClose.value === null) {
        previousClose.value = data.previousClose ?? null;
      }
      changeAmount.value = data.changeAmount ?? changeAmount.value;
      changeRate.value = data.changeRate ?? changeRate.value;
      lastUpdatedAt.value = data.quotedAt ?? new Date().toISOString();
    } catch (err) {
      console.error("[usePriceFeed] REST 시세 조회 실패", err);
    }
  }

  // ── 소켓 tick 처리 ────────────────────────────────────────────────────────
  function handleTick(payload) {
    if (isDestroyed) return;

    currentPrice.value = payload.currentPrice ?? payload.price ?? currentPrice.value;
    // previousClose 는 소켓 payload 에 없으면 기존 REST 값 유지
    if (payload.previousClose != null && previousClose.value === null) {
      previousClose.value = payload.previousClose;
    }
    changeAmount.value = payload.changeAmount ?? payload.change ?? changeAmount.value;
    changeRate.value = payload.changeRate ?? changeRate.value;
    lastUpdatedAt.value = payload.quotedAt ?? new Date().toISOString();
  }

  // ── 구독 등록/해제 ────────────────────────────────────────────────────────
  function registerTickSubscription() {
    if (isDestroyed) return;
    unsubscribeTick?.();
    unsubscribeTick = subscribeTick(ticker, handleTick);
  }

  function releaseTickSubscription() {
    unsubscribeTick?.();
    unsubscribeTick = null;
  }

  // ── 연결 상태 변화 핸들러 ────────────────────────────────────────────────
  async function handleConnectionChange(isNowConnected) {
    if (isDestroyed) return;

    if (isNowConnected) {
      reconnectAttempts = 0;
      status.value = PRICE_FEED_STATUS.CONNECTED;
      registerTickSubscription();
      // 재연결 성공 시 REST 재조회로 공백을 메움
      await loadRestQuote();
    } else {
      releaseTickSubscription();
      reconnectAttempts += 1;
      if (reconnectAttempts > PRICE_FEED_MAX_RECONNECT_ATTEMPTS) {
        status.value = PRICE_FEED_STATUS.FAILED;
      } else {
        status.value = PRICE_FEED_STATUS.RECONNECTING;
      }
    }
  }

  // ── 에러 핸들러 ──────────────────────────────────────────────────────────
  function handleError(err) {
    if (isDestroyed) return;
    console.error("[usePriceFeed] 소켓 에러", err);
    // 연결 끊김 핸들러가 별도로 상태를 갱신하므로 여기서는 로깅만 수행
  }

  // ── 초기화 ───────────────────────────────────────────────────────────────
  async function init() {
    // 1) 소켓 연결 전에 REST 로 초기값을 채워 빈 화면 방지
    await loadRestQuote();

    if (isDestroyed) return;

    // 2) 연결 상태 리스너 등록 (등록 즉시 현재 연결 상태로 1회 호출됨)
    offConnectionChange = onConnectionChange(handleConnectionChange);
    offError = onError(handleError);
  }

  // ── 정리 ─────────────────────────────────────────────────────────────────
  function cleanup() {
    isDestroyed = true;
    releaseTickSubscription();
    offConnectionChange?.();
    offError?.();
    offConnectionChange = null;
    offError = null;
  }

  onUnmounted(cleanup);

  // 초기화 즉시 실행
  init();

  return {
    // 시세
    currentPrice,
    previousClose,
    changeAmount,
    changeRate,
    lastUpdatedAt,
    // 연결 상태
    status,
    isConnected,
    isReconnecting,
    isFailed,
  };
}
