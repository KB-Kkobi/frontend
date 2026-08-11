import { describe, it, expect } from 'vitest'
import { calcExpectedAmount, calcMaxBuyQuantity } from '@/utils/trade'

describe('calcExpectedAmount', () => {
  it('수량과 가격을 곱한 예상 체결금액을 반환한다', () => {
    expect(calcExpectedAmount(10, 76470)).toBe(764700)
  })

  it('수량이 0이면 0을 반환한다', () => {
    expect(calcExpectedAmount(0, 76470)).toBe(0)
  })

  it('가격이 0이면 0을 반환한다', () => {
    expect(calcExpectedAmount(10, 0)).toBe(0)
  })
})

describe('calcMaxBuyQuantity', () => {
  it('주문가능금액을 가격으로 나눈 내림값을 반환한다', () => {
    expect(calcMaxBuyQuantity(2700000, 76470)).toBe(Math.floor(2700000 / 76470))
  })

  it('가격이 0이면 0을 반환한다 (0 나누기 방지)', () => {
    expect(calcMaxBuyQuantity(2700000, 0)).toBe(0)
  })

  it('주문가능금액이 0이면 0을 반환한다', () => {
    expect(calcMaxBuyQuantity(0, 76470)).toBe(0)
  })

  it('소수점이 발생해도 내림 처리한다', () => {
    // floor(100000 / 30001) = 3
    expect(calcMaxBuyQuantity(100000, 30001)).toBe(3)
  })

  it('price가 undefined이면 0을 반환한다', () => {
    expect(calcMaxBuyQuantity(2700000, undefined)).toBe(0)
  })
})
