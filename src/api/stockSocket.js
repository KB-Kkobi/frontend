import { Client, ReconnectionTimeMode } from "@stomp/stompjs";

const TICKER_PATTERN = /^[A-Za-z0-9]{1,20}$/;
const RECONNECT_INITIAL_MS = 500;
const RECONNECT_MAX_MS = 30_000;

function buildBrokerUrl() {
  const explicit = import.meta.env.VITE_STOCK_WS_URL;
  if (explicit) return explicit;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws-stocks`;
}

function assertTicker(code) {
  if (typeof code !== "string" || !TICKER_PATTERN.test(code)) {
    throw new Error(`유효하지 않은 종목코드입니다: ${code}`);
  }
}

/**
 * 종목별 구독 상태
 * {
 *   subscription: StompSubscription | null,
 *   handlers: Set<(tick) => void>,
 * }
 */
const subscriptions = new Map();
const connectionListeners = new Set();
const errorListeners = new Set();

let client = null;
let connected = false;
let activateRequested = false;

function notifyConnection() {
  connectionListeners.forEach((handler) => {
    try {
      handler(connected);
    } catch (err) {
      console.error("[stockSocket] connection listener error", err);
    }
  });
}

function notifyError(error) {
  errorListeners.forEach((handler) => {
    try {
      handler(error);
    } catch (err) {
      console.error("[stockSocket] error listener error", err);
    }
  });
}

function topicOf(code) {
  return `/topic/stocks/${code}`;
}

function dispatchTick(code, frame) {
  const entry = subscriptions.get(code);
  if (!entry) return;

  let payload;
  try {
    payload = JSON.parse(frame.body);
  } catch (err) {
    console.error("[stockSocket] tick JSON 파싱 실패", err);
    return;
  }

  entry.handlers.forEach((handler) => {
    try {
      handler(payload);
    } catch (err) {
      console.error("[stockSocket] tick handler error", err);
    }
  });
}

function subscribeUpstream(code) {
  if (!client || !connected) return;
  const entry = subscriptions.get(code);
  if (!entry || entry.subscription) return;

  entry.subscription = client.subscribe(topicOf(code), (frame) => {
    dispatchTick(code, frame);
  });
}

function unsubscribeUpstream(code) {
  const entry = subscriptions.get(code);
  if (!entry?.subscription) return;

  try {
    entry.subscription.unsubscribe();
  } catch (err) {
    console.error("[stockSocket] unsubscribe 실패", err);
  }
  entry.subscription = null;
}

function ensureClient() {
  if (client) return client;

  client = new Client({
    brokerURL: buildBrokerUrl(),
    reconnectDelay: RECONNECT_INITIAL_MS,
    reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    maxReconnectDelay: RECONNECT_MAX_MS,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    onConnect: () => {
      connected = true;
      notifyConnection();
      // 재연결 시 기존 구독 복원
      subscriptions.forEach((_entry, code) => subscribeUpstream(code));
    },
    onDisconnect: () => {
      connected = false;
      notifyConnection();
      // subscription 객체는 서버측 세션과 함께 무효화되므로 초기화
      subscriptions.forEach((entry) => {
        entry.subscription = null;
      });
    },
    onWebSocketClose: () => {
      if (!connected) return;
      connected = false;
      notifyConnection();
      subscriptions.forEach((entry) => {
        entry.subscription = null;
      });
    },
    onStompError: (frame) => {
      const message =
        frame?.headers?.message ?? "STOMP 프로토콜 에러가 발생했습니다.";
      notifyError(new Error(message));
    },
    onWebSocketError: (event) => {
      notifyError(event instanceof Error ? event : new Error("WebSocket 에러"));
    },
  });

  return client;
}

/** 연결 활성화. 이미 활성이면 no-op. */
export function connect() {
  ensureClient();
  if (activateRequested) return;
  activateRequested = true;
  client.activate();
}

/** 연결 해제. 모든 구독 정리 후 클라이언트 비활성화. */
export function disconnect() {
  if (!client) return;
  subscriptions.forEach((_entry, code) => unsubscribeUpstream(code));
  subscriptions.clear();
  activateRequested = false;
  client.deactivate();
  connected = false;
  notifyConnection();
}

/**
 * 종목 tick 구독.
 * 같은 종목을 여러 곳에서 구독해도 실제 STOMP subscribe는 1개만 열린다.
 *
 * @param {string} code 6자리 종목코드
 * @param {(tick: object) => void} handler
 * @returns {() => void} unsubscribe 함수
 */
export function subscribeTick(code, handler) {
  assertTicker(code);
  if (typeof handler !== "function") {
    throw new Error("handler는 함수여야 합니다.");
  }

  connect();

  let entry = subscriptions.get(code);
  if (!entry) {
    entry = { subscription: null, handlers: new Set() };
    subscriptions.set(code, entry);
  }
  entry.handlers.add(handler);

  // 첫 구독자면 실제 STOMP subscribe 시도 (연결 안 됐어도 onConnect에서 복원됨)
  if (entry.handlers.size === 1) {
    subscribeUpstream(code);
  }

  let released = false;
  return function unsubscribe() {
    if (released) return;
    released = true;

    const current = subscriptions.get(code);
    if (!current) return;
    current.handlers.delete(handler);

    if (current.handlers.size === 0) {
      unsubscribeUpstream(code);
      subscriptions.delete(code);
    }
  };
}

/** 연결 상태 변화 리스너 등록. 등록 즉시 현재 상태로 1회 호출됨. */
export function onConnectionChange(handler) {
  if (typeof handler !== "function") {
    throw new Error("handler는 함수여야 합니다.");
  }
  connectionListeners.add(handler);
  handler(connected);
  return function off() {
    connectionListeners.delete(handler);
  };
}

/** 소켓/STOMP 에러 리스너 등록. */
export function onError(handler) {
  if (typeof handler !== "function") {
    throw new Error("handler는 함수여야 합니다.");
  }
  errorListeners.add(handler);
  return function off() {
    errorListeners.delete(handler);
  };
}

export function isConnected() {
  return connected;
}
