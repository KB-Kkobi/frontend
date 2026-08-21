import { formatCurrency, formatInterestRate } from '@/utils/format'
import {
  PRODUCT_TRANSACTION_TYPES,
  getProductTransactionLabel,
  getProductTypeLabel,
} from '@/constants/product'
import { ORDER_STATUS } from '@/constants/trade'

// 예적금 거래 유형 배지 색상
const PRODUCT_TRANSACTION_PILL_COLOR = {
  [PRODUCT_TRANSACTION_TYPES.SUBSCRIBE]: 'green',
  [PRODUCT_TRANSACTION_TYPES.PAYMENT]: 'blue',
  [PRODUCT_TRANSACTION_TYPES.ADDITIONAL_PAYMENT]: 'blue',
  [PRODUCT_TRANSACTION_TYPES.TERMINATE]: 'yellow',
  [PRODUCT_TRANSACTION_TYPES.MATURITY]: 'lavender',
}

function formatDatetime(raw) {
  // "yyyy-MM-dd HH:mm:ss" 또는 ISO8601 모두 처리
  if (!raw) return ''
  const d = new Date(raw.replace(' ', 'T'))
  if (isNaN(d.getTime())) return String(raw)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

function parseOccurredAt(raw) {
  if (!raw) return null
  const d = new Date(raw.replace(' ', 'T'))
  if (isNaN(d.getTime())) {
    console.warn('[historyNormalizer] 날짜 파싱 실패, 항목 제외:', raw)
    return null
  }
  return d
}

function stockStatusLabel(status) {
  const map = {
    [ORDER_STATUS.FILLED]: '체결',
    [ORDER_STATUS.CANCELLED]: '사용자 취소',
    [ORDER_STATUS.EXPIRED]: '장마감 만료',
    [ORDER_STATUS.PENDING]: '대기중',
    [ORDER_STATUS.REJECTED]: '거부됨',
  }
  return map[status] ?? status ?? ''
}

function stockStatusColor(status) {
  if (status === ORDER_STATUS.FILLED) return 'green'
  if (status === ORDER_STATUS.PENDING) return 'yellow'
  if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.EXPIRED) return 'blue'
  return 'pink'
}

function buildStockStats(order) {
  const pricePerShare = order.executedPrice ?? order.orderPrice
  return [
    { label: '주문 수량', value: order.quantity != null ? `${order.quantity}주` : '--' },
    { label: '주문 가격', value: pricePerShare != null ? formatCurrency(pricePerShare) : '--' },
    { label: '거래 금액', value: order.executedAmount != null ? formatCurrency(order.executedAmount) : '--' },
  ]
}

export function normalizeStockOrder(order) {
  const occurredAt = parseOccurredAt(order.createdAt ?? order.orderedAt)
  if (!occurredAt) return null
  return {
    id: `STOCK-${order.securityOrderId ?? order.id}`,
    type: 'STOCK',
    occurredAt,
    name: order.securityName ?? order.name ?? order.ticker ?? '--',
    subLabel: order.ticker ?? '',
    pill: {
      label: stockStatusLabel(order.status),
      color: stockStatusColor(order.status),
    },
    datetime: formatDatetime(order.createdAt ?? order.orderedAt),
    stats: buildStockStats(order),
  }
}

export function normalizeProductHistory(item) {
  const occurredAt = parseOccurredAt(item.processedAt)
  if (!occurredAt) return null
  return {
    id: `PRODUCT-${item.productTransactionId}`,
    type: 'PRODUCT',
    _productType: (item.productType ?? '').toUpperCase(),
    occurredAt,
    name: item.productName ?? '--',
    subLabel: item.financialCompanyName ?? '',
    pill: {
      label: getProductTransactionLabel(item.transactionType, item.productType),
      color: PRODUCT_TRANSACTION_PILL_COLOR[item.transactionType] ?? 'green',
    },
    datetime: formatDatetime(item.processedAt),
    stats: [
      { label: '상품 유형', value: getProductTypeLabel(item.productType) },
      { label: '처리 금액', value: item.amount != null ? formatCurrency(Number(item.amount)) : '--' },
      { label: '금리', value: formatInterestRate(item.appliedRate) },
    ],
  }
}

/**
 * 기간 필터: 날짜 문자열(YYYY-MM-DD) 기준, 당일 포함
 * 예적금 processedAt은 KST "yyyy-MM-dd HH:mm:ss" 형식 → 날짜 부분만 비교
 */
export function filterByPeriod(items, fromDateStr) {
  if (!fromDateStr) return items
  return items.filter((item) => {
    const dateStr = item.occurredAt.toISOString().slice(0, 10)
    return dateStr >= fromDateStr
  })
}

/**
 * 종류 필터: selectedTypes 배열.
 * 빈 배열이면 전체. 'stock'→STOCK, 'deposit'→PRODUCT(DEPOSIT), 'saving'→PRODUCT(SAVING)
 * 현재 STOCK은 세부 유형(equityEtf 등) API에서 오지 않으므로 'stock' 선택 시 STOCK 전체 포함
 */
export function filterByTypes(items, selectedTypes) {
  if (!selectedTypes || selectedTypes.length === 0) return items
  return items.filter((item) => {
    if (item.type === 'STOCK') return selectedTypes.includes('stock')
    if (item.type === 'PRODUCT') {
      if (selectedTypes.includes('deposit') && item._productType === 'DEPOSIT') return true
      if (selectedTypes.includes('saving') && item._productType === 'SAVING') return true
      return false
    }
    return false
  })
}

/**
 * 정렬: occurredAt 기준, tie-breaker는 id 문자열
 * sort: 'desc' = 최신순, 'asc' = 오래된순
 */
export function sortItems(items, sort) {
  return [...items].sort((a, b) => {
    const diff = a.occurredAt - b.occurredAt
    if (diff !== 0) return sort === 'desc' ? -diff : diff
    return sort === 'desc'
      ? String(b.id).localeCompare(String(a.id))
      : String(a.id).localeCompare(String(b.id))
  })
}
