import { describe, expect, it } from 'vitest'
import { isHorizontalSwipeIntent, resolveSwipeTabKey } from '@/utils/swipeNavigation'

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

  it('자산현황(첫 탭)에서 오른쪽 swipe는 항상 null이다', () => {
    expect(resolve('virtual-assets', 100)).toBeNull()
    expect(resolve('virtual-assets', 60, 10)).toBeNull()
  })

  it('내역(마지막 탭)에서 왼쪽 swipe는 항상 null이다', () => {
    expect(resolve('virtual-history', -100)).toBeNull()
    expect(resolve('virtual-history', -60, 10)).toBeNull()
  })

  it('메인 탭이 아닌 임의의 route + swipe는 항상 null이다', () => {
    expect(resolve('stock-holdings', -100)).toBeNull()
    expect(resolve('product-termination', 100)).toBeNull()
    expect(resolve('home', -100)).toBeNull()
  })
})

describe('isHorizontalSwipeIntent', () => {
  function intent(deltaX, deltaY, threshold = 50) {
    return isHorizontalSwipeIntent({ deltaX, deltaY, threshold, directionRatio: 1.2 })
  }

  it('threshold 이상 + 세로보다 충분히 가로면 true', () => {
    expect(intent(50, 0)).toBe(true)
    expect(intent(-50, 0)).toBe(true)
    expect(intent(100, 10)).toBe(true)
  })

  it('threshold 미만이면 false', () => {
    expect(intent(49, 0)).toBe(false)
    expect(intent(-49, 0)).toBe(false)
  })

  it('세로 이동이 방향비 기준으로 가로 이동을 압도하면 false', () => {
    expect(intent(60, 50)).toBe(false)
    expect(intent(60, 100)).toBe(false)
  })

  it('touchmove처럼 threshold를 작게 주면 더 일찍 true가 된다', () => {
    // VirtualInvestView의 touchmove는 8px 같은 작은 threshold로 조기 판단해
    // preventDefault를 건다 — resolveSwipeTabKey의 50px 확정 threshold와는 별개다.
    expect(intent(8, 0, 8)).toBe(true)
    expect(intent(7, 0, 8)).toBe(false)
  })
})
