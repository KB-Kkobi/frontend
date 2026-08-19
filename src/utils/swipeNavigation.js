// touchmove 중 "가로 스와이프 의도"가 충분히 확인됐는지 판단하는 조건.
// resolveSwipeTabKey의 진입 조건과 같은 공식을 공유하되 threshold는 호출부에서
// 다르게 줄 수 있다 — touchmove에서는 훨씬 작은 threshold로 조기에 판단해
// 브라우저 기본 가로 navigation을 선점 차단하고, touchend에서는 원래 threshold로
// 실제 탭 이동 여부를 확정한다.
export function isHorizontalSwipeIntent({ deltaX, deltaY, threshold, directionRatio }) {
  const horizontalDistance = Math.abs(deltaX)
  const verticalDistance = Math.abs(deltaY)

  return horizontalDistance >= threshold && horizontalDistance > verticalDistance * directionRatio
}

export function resolveSwipeTabKey({
  tabs,
  currentKey,
  deltaX,
  deltaY,
  threshold,
  directionRatio,
}) {
  if (!isHorizontalSwipeIntent({ deltaX, deltaY, threshold, directionRatio })) {
    return null
  }

  const currentIndex = tabs.findIndex((tab) => tab.key === currentKey)
  if (currentIndex === -1) return null

  const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1
  if (nextIndex < 0 || nextIndex >= tabs.length) return null

  return tabs[nextIndex].key
}
