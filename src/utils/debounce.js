/**
 * 마지막 호출 후 delay(ms)가 지나야 fn을 실행하는 디바운스 함수.
 * 반환된 함수의 `cancel()`로 대기 중인 실행을 즉시 취소할 수 있다.
 */
export function debounce(fn, delay = 300) {
  let timerId = null;

  function debounced(...args) {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      fn(...args);
    }, delay);
  }

  debounced.cancel = () => {
    if (timerId) clearTimeout(timerId);
    timerId = null;
  };

  return debounced;
}
