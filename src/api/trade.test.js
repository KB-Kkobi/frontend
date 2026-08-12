import { beforeEach, describe, it, expect, vi } from 'vitest'

// authStorage 모킹 — Node 환경에 localStorage가 없으므로 사전에 대체
vi.mock('@/utils/authStorage', () => ({
  getAuthorizationHeader: () => 'Bearer test-token',
  readAuthSession: () => null,
  saveAuthSession: () => {},
  clearAuthSession: () => {},
}))

import {
  fetchPortfolio,
  fetchHoldings,
  fetchQuote,
  fetchOrderable,
  createOrder,
  cancelOrder,
  fetchOrders,
} from '@/api/trade'

// fetch 전역 모킹
const mockFetch = vi.fn()
global.fetch = mockFetch

/**
 * 성공 응답 mock 헬퍼
 */
function mockFetchResponse(body, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status < 400,
    status,
    headers: { get: () => 'application/json' },
    text: async () => JSON.stringify(body),
  })
}

/**
 * 실패 응답 mock 헬퍼
 */
function mockFetchError(message, status) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    headers: { get: () => 'application/json' },
    text: async () => JSON.stringify({ message }),
  })
}

beforeEach(() => {
  mockFetch.mockReset()
})

// ──────────────────────────────────────────────────────────
// fetchPortfolio
// ──────────────────────────────────────────────────────────
describe('fetchPortfolio', () => {
  it('GET /api/accounts/me/portfolio 를 호출하고 응답을 반환한다', async () => {
    const portfolioData = { totalAsset: 3000000, cash: 270000 }
    mockFetchResponse(portfolioData)

    const result = await fetchPortfolio()

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/accounts/me/portfolio')
    expect(options.method).toBe('GET')
    expect(result).toEqual(portfolioData)
  })

  it('서버 오류(500) 시 ApiError를 던진다', async () => {
    mockFetchError('서버 오류', 500)
    await expect(fetchPortfolio()).rejects.toThrow()
  })
})

// ──────────────────────────────────────────────────────────
// fetchHoldings
// ──────────────────────────────────────────────────────────
describe('fetchHoldings', () => {
  it('GET /api/accounts/me/holdings 를 호출한다', async () => {
    mockFetchResponse([{ securityId: 1, quantity: 5 }])

    await fetchHoldings()

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/accounts/me/holdings')
    expect(options.method).toBe('GET')
  })

  it('서버 오류(500) 시 ApiError를 던진다', async () => {
    mockFetchError('서버 오류', 500)
    await expect(fetchHoldings()).rejects.toThrow()
  })
})

// ──────────────────────────────────────────────────────────
// fetchQuote
// ──────────────────────────────────────────────────────────
describe('fetchQuote', () => {
  it('GET /api/securities/33/quote 를 호출한다', async () => {
    mockFetchResponse({ currentPrice: 76470 })

    await fetchQuote(33)

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/securities/33/quote')
    expect(options.method).toBe('GET')
  })

  it('서버 오류(404) 시 ApiError를 던진다', async () => {
    mockFetchError('종목 정보를 찾을 수 없습니다.', 404)
    await expect(fetchQuote(33)).rejects.toThrow()
  })
})

// ──────────────────────────────────────────────────────────
// fetchOrderable
// ──────────────────────────────────────────────────────────
describe('fetchOrderable', () => {
  it('GET /api/securities/33/orderable 를 호출한다', async () => {
    mockFetchResponse({ orderableCash: 2700000, maxBuyQuantityAtMarket: 35 })

    await fetchOrderable(33)

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/securities/33/orderable')
    expect(options.method).toBe('GET')
  })

  it('서버 오류(401) 시 ApiError를 던진다', async () => {
    mockFetchError('인증이 필요합니다.', 401)
    await expect(fetchOrderable(33)).rejects.toThrow()
  })
})

// ──────────────────────────────────────────────────────────
// createOrder
// ──────────────────────────────────────────────────────────
describe('createOrder', () => {
  it('시장가 주문 시 body에 price 키가 없다', async () => {
    mockFetchResponse({ orderId: 1001 }, 201)

    await createOrder({
      securityId: 33,
      orderType: 'BUY',
      orderMethod: 'MARKET',
      price: 76470,
      quantity: 3,
    })

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/orders')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body).not.toHaveProperty('price')
    expect(body.orderMethod).toBe('MARKET')
    expect(body.quantity).toBe(3)
  })

  it('지정가 주문 시 body에 price가 포함된다', async () => {
    mockFetchResponse({ orderId: 1002 }, 201)

    await createOrder({
      securityId: 33,
      orderType: 'BUY',
      orderMethod: 'LIMIT',
      price: 76000,
      quantity: 2,
    })

    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body).toHaveProperty('price', 76000)
    expect(body.orderMethod).toBe('LIMIT')
  })

  it('서버 오류(400) 시 ApiError를 던진다', async () => {
    mockFetchError('주문가능금액이 부족합니다.', 400)

    await expect(
      createOrder({ securityId: 33, orderType: 'BUY', orderMethod: 'MARKET', quantity: 9999 }),
    ).rejects.toThrow()
  })
})

// ──────────────────────────────────────────────────────────
// cancelOrder
// ──────────────────────────────────────────────────────────
describe('cancelOrder', () => {
  it('DELETE /api/orders/9002 를 호출한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: { get: () => null },
      text: async () => '',
    })

    await cancelOrder(9002)

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/orders/9002')
    expect(options.method).toBe('DELETE')
  })

  it('서버 오류(404) 시 ApiError를 던진다', async () => {
    mockFetchError('주문을 찾을 수 없습니다.', 404)
    await expect(cancelOrder(9002)).rejects.toThrow()
  })
})

// ──────────────────────────────────────────────────────────
// fetchOrders
// ──────────────────────────────────────────────────────────
describe('fetchOrders', () => {
  it('파라미터가 없으면 쿼리스트링 없이 /api/orders 를 호출한다', async () => {
    mockFetchResponse({ content: [], totalElements: 0 })

    await fetchOrders({})

    const [url] = mockFetch.mock.calls[0]
    // 쿼리스트링 없이 /api/orders 로 끝나야 한다
    expect(url).toMatch(/\/api\/orders$/)
  })

  it('status, page, size 파라미터가 있으면 쿼리스트링에 모두 포함된다', async () => {
    mockFetchResponse({ content: [], totalElements: 0 })

    await fetchOrders({ status: 'PENDING', page: 0, size: 20 })

    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/orders')
    expect(url).toContain('status=PENDING')
    expect(url).toContain('page=0')
    expect(url).toContain('size=20')
  })

  it('undefined 값인 파라미터는 쿼리스트링에서 제외된다', async () => {
    mockFetchResponse({ content: [], totalElements: 0 })

    await fetchOrders({ status: 'PENDING', securityId: undefined })

    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('status=PENDING')
    expect(url).not.toContain('securityId')
  })

  it('서버 오류(500) 시 ApiError를 던진다', async () => {
    mockFetchError('서버 오류', 500)
    await expect(fetchOrders({})).rejects.toThrow()
  })
})
