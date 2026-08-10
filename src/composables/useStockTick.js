import { isRef, onUnmounted, ref, watch } from "vue";
import {
  onConnectionChange,
  onError,
  subscribeTick,
} from "@/api/stockSocket";

/**
 * 종목 실시간 tick 구독 composable.
 *
 * @param {string | import("vue").Ref<string>} codeInput 6자리 종목코드 (ref 지원)
 * @returns {{
 *   tick: import("vue").Ref<object|null>,
 *   isConnected: import("vue").Ref<boolean>,
 *   error: import("vue").Ref<Error|null>,
 * }}
 */
export function useStockTick(codeInput) {
  const tick = ref(null);
  const isConnected = ref(false);
  const error = ref(null);

  let unsubscribeTick = null;

  function teardown() {
    if (unsubscribeTick) {
      unsubscribeTick();
      unsubscribeTick = null;
    }
    tick.value = null;
  }

  function setup(code) {
    teardown();
    if (!code) return;

    try {
      unsubscribeTick = subscribeTick(code, (payload) => {
        tick.value = payload;
      });
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
    }
  }

  const offConnection = onConnectionChange((next) => {
    isConnected.value = next;
  });
  const offError = onError((err) => {
    error.value = err;
  });

  if (isRef(codeInput)) {
    watch(
      codeInput,
      (next) => {
        error.value = null;
        setup(next);
      },
      { immediate: true },
    );
  } else {
    setup(codeInput);
  }

  onUnmounted(() => {
    teardown();
    offConnection();
    offError();
  });

  return { tick, isConnected, error };
}
