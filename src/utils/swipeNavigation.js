export function resolveSwipeTabKey({
  tabs,
  currentKey,
  deltaX,
  deltaY,
  threshold,
  directionRatio,
}) {
  const horizontalDistance = Math.abs(deltaX)
  const verticalDistance = Math.abs(deltaY)

  if (
    horizontalDistance < threshold ||
    horizontalDistance <= verticalDistance * directionRatio
  ) {
    return null
  }

  const currentIndex = tabs.findIndex((tab) => tab.key === currentKey)
  if (currentIndex === -1) return null

  const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1
  if (nextIndex < 0 || nextIndex >= tabs.length) return null

  return tabs[nextIndex].key
}
