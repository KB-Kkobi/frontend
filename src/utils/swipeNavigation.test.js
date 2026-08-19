import { describe, expect, it } from 'vitest'
import { resolveSwipeTabKey } from '@/utils/swipeNavigation'

const tabs = [
  { key: 'virtual-assets' },
  { key: 'virtual-products' },
  { key: 'virtual-history' },
]

function resolve(currentKey, deltaX, deltaY = 0) {
  return resolveSwipeTabKey({
    tabs,
    currentKey,
    deltaX,
    deltaY,
    threshold: 50,
    directionRatio: 1.2,
  })
}

describe('resolveSwipeTabKey', () => {
  it('왼쪽 swipe는 다음 탭으로 이동한다', () => {
    expect(resolve('virtual-assets', -100)).toBe('virtual-products')
    expect(resolve('virtual-products', -100)).toBe('virtual-history')
  })

  it('오른쪽 swipe는 이전 탭으로 이동한다', () => {
    expect(resolve('virtual-history', 100)).toBe('virtual-products')
    expect(resolve('virtual-products', 100)).toBe('virtual-assets')
  })

  it('첫 탭과 마지막 탭의 범위를 넘지 않는다', () => {
    expect(resolve('virtual-assets', 100)).toBeNull()
    expect(resolve('virtual-history', -100)).toBeNull()
  })

  it('50px 미만 이동은 무시한다', () => {
    expect(resolve('virtual-products', 49)).toBeNull()
    expect(resolve('virtual-products', -49)).toBeNull()
  })

  it('세로 이동이 우세한 동작은 무시한다', () => {
    expect(resolve('virtual-products', 100, 100)).toBeNull()
    expect(resolve('virtual-products', -100, 100)).toBeNull()
  })

  it('메인 탭이 아닌 route는 무시한다', () => {
    expect(resolve('product-holdings', -100)).toBeNull()
  })
})
