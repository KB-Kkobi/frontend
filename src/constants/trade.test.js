import { describe, it, expect } from 'vitest'
import { ORDER_TYPE, ORDER_METHOD, ORDER_STATUS, ORDER_ERROR_MESSAGE } from '@/constants/trade'

describe('ORDER_TYPE', () => {
  it('BUY 값이 "BUY"이다', () => {
    expect(ORDER_TYPE.BUY).toBe('BUY')
  })

  it('SELL 값이 "SELL"이다', () => {
    expect(ORDER_TYPE.SELL).toBe('SELL')
  })
})

describe('ORDER_METHOD', () => {
  it('MARKET 값이 "MARKET"이다', () => {
    expect(ORDER_METHOD.MARKET).toBe('MARKET')
  })

  it('LIMIT 값이 "LIMIT"이다', () => {
    expect(ORDER_METHOD.LIMIT).toBe('LIMIT')
  })
})

describe('ORDER_STATUS', () => {
  it('PENDING 값이 "PENDING"이다', () => {
    expect(ORDER_STATUS.PENDING).toBe('PENDING')
  })

  it('FILLED 값이 "FILLED"이다', () => {
    expect(ORDER_STATUS.FILLED).toBe('FILLED')
  })

  it('CANCELLED 값이 "CANCELLED"이다', () => {
    expect(ORDER_STATUS.CANCELLED).toBe('CANCELLED')
  })

  it('EXPIRED 값이 "EXPIRED"이다', () => {
    expect(ORDER_STATUS.EXPIRED).toBe('EXPIRED')
  })

  it('REJECTED 값이 "REJECTED"이다', () => {
    expect(ORDER_STATUS.REJECTED).toBe('REJECTED')
  })
})

describe('ORDER_ERROR_MESSAGE', () => {
  const EXPECTED_KEYS = [
    'INVALID_QUANTITY',
    'INVALID_PRICE',
    'PRICE_REQUIRED_FOR_LIMIT',
    'INSUFFICIENT_CASH',
    'INSUFFICIENT_QUANTITY',
    'SECURITY_NOT_FOUND',
    'MARKET_CLOSED',
    'QUOTE_UNAVAILABLE',
    'ORDER_NOT_FOUND',
    'ORDER_NOT_CANCELABLE',
    'FORBIDDEN_ORDER',
  ]

  it('에러 메시지 키가 11개 모두 존재한다', () => {
    expect(Object.keys(ORDER_ERROR_MESSAGE)).toHaveLength(11)
    EXPECTED_KEYS.forEach((key) => {
      expect(ORDER_ERROR_MESSAGE).toHaveProperty(key)
    })
  })

  it('모든 에러 메시지가 빈 문자열이 아니다', () => {
    EXPECTED_KEYS.forEach((key) => {
      expect(ORDER_ERROR_MESSAGE[key]).toBeTruthy()
      expect(typeof ORDER_ERROR_MESSAGE[key]).toBe('string')
      expect(ORDER_ERROR_MESSAGE[key].length).toBeGreaterThan(0)
    })
  })
})
