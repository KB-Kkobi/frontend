# 주식 매매 API 명세

> 버전: v1 초안 (2026-08-10)
> 대상: 가상 주식 투자 앱 kkobi — 보유 자산 조회 / 매수·매도 주문

---

## 0. 확정된 정책

| 항목 | 결정 |
|---|---|
| 지정가 주문 | 미체결 시 `PENDING` 유지, 시세 수신 시 조건 충족하면 체결. 당일 장 마감 시 자동 만료 |
| 시장가 주문 | 요청 시점 현재가로 즉시 체결 |
| 장 운영 | 실제 시장과 동일 (평일 09:00~15:30 KST, 휴장일 제외). 장외 주문은 거절 |
| 수수료·세금 | 미반영 |
| 평균단가 | 이동평균 |
| 주문 취소 | 지원 (`PENDING` 상태만) |
| 금액 단위 | 원 단위 정수 (소수점 없음) |
| 예적금 | 이번 범위 제외 |
| 전일 종가 | KIS 응답값 사용 (별도 테이블 없음) |
| 수익률 | 퍼센트, 소수 둘째자리 (예: `5.23`) |

---

## 1. DB 마이그레이션

`db/migration/` 에 추가.

### V__add_order_lock_columns.sql

지정가 주문이 걸린 동안 해당 현금·수량을 다른 주문에 사용할 수 없도록 잠금 컬럼을 추가한다.
이 컬럼이 없으면 동일 자금으로 지정가 매수를 무한히 걸 수 있다.

```sql
ALTER TABLE accounts
  ADD COLUMN locked_cash BIGINT NOT NULL DEFAULT 0 AFTER cash_balance;

ALTER TABLE holding_securities
  ADD COLUMN locked_quantity INT NOT NULL DEFAULT 0 AFTER quantity;
```

- 주문가능금액 = `accounts.cash_balance - accounts.locked_cash`
- 매도가능수량 = `holding_securities.quantity - holding_securities.locked_quantity`

### V__fix_security_orders_columns.sql

```sql
ALTER TABLE security_orders
  MODIFY COLUMN security_id BIGINT NOT NULL,
  MODIFY COLUMN order_price BIGINT NULL COMMENT '지정가 주문의 지정 가격. 시장가는 NULL',
  MODIFY COLUMN executed_price BIGINT NULL COMMENT '체결 단가. 미체결은 NULL',
  MODIFY COLUMN order_method ENUM('MARKET','LIMIT') NOT NULL,
  MODIFY COLUMN order_type ENUM('BUY','SELL') NOT NULL,
  MODIFY COLUMN status ENUM('PENDING','FILLED','CANCELLED','EXPIRED','REJECTED') NOT NULL;
```

- `order_price` 를 `NULL` 허용으로 바꾼 이유: 시장가 주문은 주문 시점에 가격이 없다. 체결 결과는 `executed_price` 에만 기록한다.
- `EXPIRED` 를 `CANCELLED` 와 분리한 이유: 사용자가 직접 취소한 것과 장 마감 자동 만료를 화면에서 구분해 표시해야 한다.

### V__add_trade_constraints_and_indexes.sql

```sql
ALTER TABLE holding_securities
  ADD CONSTRAINT uk_holding_account_security UNIQUE (account_id, security_id);

ALTER TABLE account_daily_snapshots
  ADD CONSTRAINT uk_snapshot_account_date UNIQUE (account_id, snapshot_date);

CREATE INDEX idx_orders_account_ordered
  ON security_orders (account_id, ordered_at DESC);

CREATE INDEX idx_orders_pending_security
  ON security_orders (status, security_id);

CREATE INDEX idx_holding_account
  ON holding_securities (account_id);

ALTER TABLE accounts
  ADD CONSTRAINT uk_accounts_user UNIQUE (user_id);
```

`idx_orders_pending_security` 는 시세 수신 시 해당 종목의 `PENDING` 주문을 스캔하기 위한 인덱스다.
`uk_accounts_user` 는 1인 1계좌 정책을 DB 레벨에서 보장한다.

### V__fix_account_transactions_type.sql

매매 체결은 `security_orders` 에만 기록한다. `account_transactions` 는 현금 입출금 전용이다.

```sql
ALTER TABLE account_transactions
  MODIFY COLUMN type ENUM('DEPOSIT','WITHDRAW') NOT NULL;
```

> 주의: 매수/매도로 인한 `cash_balance` 변동은 `account_transactions` 에 기록하지 않는다.
> 따라서 `account_transactions` 의 합계로 현금 잔고를 재구성할 수 없다. 현금 이력이 필요하면
> `security_orders` 의 체결 내역과 함께 조회해야 한다.

---

## 2. 공통 규약

### 인증

모든 엔드포인트는 인증 필요.

```
Authorization: Bearer {accessToken}
```

계좌는 토큰의 `userId` 로 서버가 조회한다. 클라이언트가 `accountId` 를 보내지 않는다.

### 응답 래퍼

> 기존 프로젝트의 공통 Response 래퍼가 있다면 그 형태를 따른다. 아래는 없을 경우의 기본형.

성공:
```json
{
  "success": true,
  "data": { }
}
```

실패:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CASH",
    "message": "주문가능금액이 부족합니다."
  }
}
```

### 타입 규약

| 항목 | 규약 |
|---|---|
| 금액 | `number`, 원 단위 정수. 소수·문자열 아님 |
| 수량 | `number`, 정수 |
| 수익률·등락률 | `number`, 퍼센트값 소수 둘째자리. `5.23` = +5.23% |
| 일시 | `string`, ISO-8601 KST offset. `"2026-08-10T09:31:22+09:00"` |
| 날짜 | `string`, `"2026-08-10"` |

### ENUM 원문

```
orderType   : "BUY" | "SELL"
orderMethod : "MARKET" | "LIMIT"
status      : "PENDING" | "FILLED" | "CANCELLED" | "EXPIRED" | "REJECTED"
market      : "KOSPI" | "KOSDAQ"
```

---

## 3. 엔드포인트

### 3.1 포트폴리오 요약

보유 자산 화면 상단. 총 자산·수익률.

```
GET /api/accounts/me/portfolio
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "totalAsset": 10847000,
    "cashBalance": 3200000,
    "lockedCash": 500000,
    "orderableCash": 2700000,
    "stockValuationAmount": 7647000,
    "stockPrincipal": 7000000,
    "stockProfit": 647000,
    "stockProfitRate": 9.24,
    "seedMoney": 10000000,
    "totalInvestedPrincipal": 10000000,
    "totalProfit": 847000,
    "totalProfitRate": 8.47,
    "quotedAt": "2026-08-10T14:22:10+09:00"
  }
}
```

| 필드 | 설명 |
|---|---|
| `totalAsset` | `cashBalance + stockValuationAmount` |
| `orderableCash` | `cashBalance - lockedCash` |
| `stockValuationAmount` | 보유종목 평가금액 합 |
| `stockPrincipal` | 보유종목 매입원금 합 (`평균단가 × 수량`) |
| `stockProfitRate` | `stockProfit / stockPrincipal × 100`. 원금 0이면 `0` |
| `totalProfit` | `totalAsset - totalInvestedPrincipal` |
| `quotedAt` | 시세 기준 시각. 장중이 아니면 마지막 캐시 시각 |

보유종목이 없으면 `stockValuationAmount`, `stockPrincipal`, `stockProfit` 은 `0`, 수익률도 `0`.

---

### 3.2 보유종목 목록

```
GET /api/accounts/me/holdings
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "holdings": [
      {
        "holdingSecurityId": 1201,
        "securityId": 33,
        "ticker": "005930",
        "name": "삼성전자",
        "market": "KOSPI",
        "quantity": 100,
        "lockedQuantity": 0,
        "sellableQuantity": 100,
        "averagePrice": 70000,
        "principalAmount": 7000000,
        "currentPrice": 76470,
        "valuationAmount": 7647000,
        "profit": 647000,
        "profitRate": 9.24,
        "previousClose": 75800,
        "changeAmount": 670,
        "changeRate": 0.88
      }
    ],
    "quotedAt": "2026-08-10T14:22:10+09:00"
  }
}
```

| 필드 | 설명 |
|---|---|
| `principalAmount` | `averagePrice × quantity` |
| `valuationAmount` | `currentPrice × quantity` |
| `profitRate` | `(currentPrice - averagePrice) / averagePrice × 100` |
| `changeAmount` | `currentPrice - previousClose`. 하락 시 음수 |
| `changeRate` | 전일 종가 대비 등락률. 하락 시 음수 |

- `quantity = 0` 인 보유 레코드는 응답에 포함하지 않는다.
- 특정 종목의 시세 조회가 실패하면 그 종목만 `currentPrice: null`, `valuationAmount: null`, `profit: null`, `profitRate: null`, `changeAmount: null`, `changeRate: null` 로 내려보내고 나머지는 정상 응답한다. 전체를 실패시키지 않는다.
- 정렬 기본값은 `valuationAmount` 내림차순.

---

### 3.3 종목 시세 조회

매수/매도 페이지에서 현재가와 전일 대비 등락률 표시용.

```
GET /api/securities/{securityId}/quote
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "securityId": 33,
    "ticker": "005930",
    "name": "삼성전자",
    "market": "KOSPI",
    "currentPrice": 76470,
    "previousClose": 75800,
    "changeAmount": 670,
    "changeRate": 0.88,
    "isMarketOpen": true,
    "quotedAt": "2026-08-10T14:22:10+09:00"
  }
}
```

- `isMarketOpen: false` 이면 `currentPrice` 는 마지막 종가/캐시값이며, 이 상태에서 주문 시 `MARKET_CLOSED` 로 거절된다.

**에러**: `SECURITY_NOT_FOUND`, `QUOTE_UNAVAILABLE`

---

### 3.4 주문가능 정보 조회

주문 화면 진입 시 호출. 주문 전 반드시 이 값으로 최대 수량을 계산한다.

```
GET /api/securities/{securityId}/orderable
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "securityId": 33,
    "orderableCash": 2700000,
    "sellableQuantity": 100,
    "currentPrice": 76470,
    "maxBuyQuantityAtMarket": 35,
    "isMarketOpen": true
  }
}
```

- `maxBuyQuantityAtMarket` = `floor(orderableCash / currentPrice)`. 시장가 기준 참고값이다.
- 지정가 매수의 최대 수량은 클라이언트가 `floor(orderableCash / 입력가격)` 으로 계산한다.
- 보유하지 않은 종목이면 `sellableQuantity: 0`.

---

### 3.5 주문 생성

```
POST /api/orders
Content-Type: application/json
```

**Request — 시장가 매수**
```json
{
  "securityId": 33,
  "orderType": "BUY",
  "orderMethod": "MARKET",
  "quantity": 10
}
```

**Request — 지정가 매도**
```json
{
  "securityId": 33,
  "orderType": "SELL",
  "orderMethod": "LIMIT",
  "price": 78000,
  "quantity": 10
}
```

| 필드 | 타입 | 필수 | 규칙 |
|---|---|---|---|
| `securityId` | number | O | |
| `orderType` | string | O | `BUY` \| `SELL` |
| `orderMethod` | string | O | `MARKET` \| `LIMIT` |
| `price` | number | `LIMIT`만 O | 양의 정수. `MARKET`이면 무시 |
| `quantity` | number | O | 1 이상 정수 |

**Response 201 — 시장가 (즉시 체결)**
```json
{
  "success": true,
  "data": {
    "securityOrderId": 9001,
    "securityId": 33,
    "ticker": "005930",
    "name": "삼성전자",
    "orderType": "BUY",
    "orderMethod": "MARKET",
    "orderPrice": null,
    "executedPrice": 76470,
    "quantity": 10,
    "executedAmount": 764700,
    "status": "FILLED",
    "orderedAt": "2026-08-10T14:22:11+09:00",
    "executedAt": "2026-08-10T14:22:11+09:00"
  }
}
```

**Response 201 — 지정가 (미체결 접수)**
```json
{
  "success": true,
  "data": {
    "securityOrderId": 9002,
    "securityId": 33,
    "ticker": "005930",
    "name": "삼성전자",
    "orderType": "SELL",
    "orderMethod": "LIMIT",
    "orderPrice": 78000,
    "executedPrice": null,
    "quantity": 10,
    "executedAmount": null,
    "status": "PENDING",
    "orderedAt": "2026-08-10T14:22:11+09:00",
    "executedAt": null
  }
}
```

#### 처리 규칙

**시장가**: 현재가로 즉시 체결. `FILLED` 반환.

**지정가**: 접수 시 아래 순서로 처리.
1. 조건 즉시 충족 여부 확인 — 매수는 `지정가 >= 현재가`, 매도는 `지정가 <= 현재가`
2. 충족하면 **현재가로** 즉시 체결 (사용자에게 불리하지 않게)
3. 미충족이면 `PENDING` 으로 접수하고 자금/수량 잠금
   - 매수: `locked_cash += price × quantity`
   - 매도: `locked_quantity += quantity`

**체결 시 잔고 반영** (단일 트랜잭션):
- 매수 — `cash_balance -= 체결금액`, 보유 레코드 upsert, 이동평균 갱신
  `newAvg = (기존평균 × 기존수량 + 체결단가 × 체결수량) / (기존수량 + 체결수량)`, 내림 처리
- 매도 — `cash_balance += 체결금액`, `quantity -= 체결수량`. `quantity = 0` 이 되면 레코드는 유지하되 목록 응답에서 제외
- `PENDING` 이었던 주문이 체결되면 잠금분을 먼저 해제한 뒤 반영

**장 마감 시**: 당일 `PENDING` 주문 전체를 `EXPIRED` 로 변경하고 잠금 해제.

**동시성**: 계좌 단위 비관적 락 또는 `cash_balance` 조건부 UPDATE 로 중복 차감을 막는다.

#### 에러

| HTTP | code | 사용자 노출 문구 |
|---|---|---|
| 400 | `INVALID_QUANTITY` | 수량은 1주 이상 입력해주세요. |
| 400 | `INVALID_PRICE` | 주문 가격을 확인해주세요. |
| 400 | `PRICE_REQUIRED_FOR_LIMIT` | 지정가 주문은 가격을 입력해야 합니다. |
| 400 | `INSUFFICIENT_CASH` | 주문가능금액이 부족합니다. |
| 400 | `INSUFFICIENT_QUANTITY` | 매도 가능 수량을 초과했습니다. |
| 404 | `SECURITY_NOT_FOUND` | 종목 정보를 찾을 수 없습니다. |
| 409 | `MARKET_CLOSED` | 지금은 거래 시간이 아닙니다. (평일 09:00~15:30) |
| 503 | `QUOTE_UNAVAILABLE` | 현재가를 불러오지 못해 주문할 수 없습니다. 잠시 후 다시 시도해주세요. |

---

### 3.6 주문 취소

```
DELETE /api/orders/{securityOrderId}
```

`PENDING` 상태만 취소 가능. 취소 시 `status = CANCELLED`, 잠금 해제.

**Response 200**
```json
{
  "success": true,
  "data": {
    "securityOrderId": 9002,
    "status": "CANCELLED",
    "updatedAt": "2026-08-10T14:30:02+09:00"
  }
}
```

| HTTP | code | 문구 |
|---|---|---|
| 404 | `ORDER_NOT_FOUND` | 주문을 찾을 수 없습니다. |
| 409 | `ORDER_NOT_CANCELABLE` | 이미 처리된 주문은 취소할 수 없습니다. |
| 403 | `FORBIDDEN_ORDER` | 접근 권한이 없습니다. |

---

### 3.7 주문 내역 조회

```
GET /api/orders?status=PENDING&securityId=33&from=2026-08-01&to=2026-08-10&page=0&size=20
```

| 파라미터 | 필수 | 설명 |
|---|---|---|
| `status` | X | 미지정 시 전체. 콤마 다중 지정 가능 (`PENDING,FILLED`) |
| `securityId` | X | 종목 필터 |
| `from`, `to` | X | `orderedAt` 기준 날짜 범위 (포함) |
| `page`, `size` | X | 기본 `0`, `20` |

**Response 200**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "securityOrderId": 9001,
        "securityId": 33,
        "ticker": "005930",
        "name": "삼성전자",
        "orderType": "BUY",
        "orderMethod": "MARKET",
        "orderPrice": null,
        "executedPrice": 76470,
        "quantity": 10,
        "executedAmount": 764700,
        "status": "FILLED",
        "orderedAt": "2026-08-10T14:22:11+09:00",
        "executedAt": "2026-08-10T14:22:11+09:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 37,
    "hasNext": true
  }
}
```

`orderedAt` 내림차순 정렬.

---

## 4. 클라이언트 호출 순서

**보유 자산 화면**
```
GET /api/accounts/me/portfolio
GET /api/accounts/me/holdings
```
두 호출은 병렬 가능. `quotedAt` 이 다를 수 있으므로 화면 표시는 `portfolio` 기준을 쓴다.

**매수/매도 화면**
```
1. GET /api/securities/{id}/quote      → 초기 현재가·등락률 표시
2. STOMP 구독 /topic/stocks/{ticker}   → 이후 현재가 실시간 갱신
3. GET /api/securities/{id}/orderable  → 주문가능금액·매도가능수량으로 입력 검증
4. POST /api/orders                    → 확인 모달 후 실행
5. 성공 시 1·3 재조회 또는 포트폴리오 화면으로 이동
6. 화면 이탈 시 구독 해제
```

`orderable` 은 주문 직전에도 한 번 더 갱신하는 것을 권장한다. 서버가 최종 검증을 하므로 클라이언트 검증은 UX 목적이다.

---

## 5. 실시간 시세 (WebSocket)

매수/매도 화면의 현재가는 STOMP 구독으로 갱신한다.

```
엔드포인트  wss://kkobi.site/ws-stocks
프로토콜    STOMP over WebSocket (SockJS 사용 여부는 기존 설정 확인)
구독 토픽   /topic/stocks/{ticker}
```

> 토픽 경로와 payload 형태는 **기존 백엔드 구현을 확인해 실제 값으로 확정**할 것.
> 아래는 REST `quote` 응답과 일관되도록 맞춘 목표 형태다.

**수신 payload**
```json
{
  "ticker": "005930",
  "currentPrice": 76470,
  "previousClose": 75800,
  "changeAmount": 670,
  "changeRate": 0.88,
  "quotedAt": "2026-08-10T14:22:10+09:00"
}
```

### 클라이언트 규칙

- **초기값은 REST `quote`**, 이후 갱신만 WebSocket으로 받는다. 소켓 연결 전 빈 화면을 만들지 않기 위함이다.
- `previousClose` 는 장중 불변이다. 소켓 payload에 없으면 REST 값을 유지한다.
- **주문 검증은 소켓 가격을 신뢰하지 않는다.** 시장가 주문의 실제 체결가는 서버가 주문 시점에 다시 조회한 값이며, 화면 표시가와 다를 수 있다. 확인 모달 문구는 "예상 체결금액"으로 표기한다.
- 연결 끊김 시 재연결하고, 재연결 성공 시 REST `quote` 를 한 번 재조회해 공백 구간을 메운다.
- 연결 실패가 지속되면 현재가 옆에 지연 표시를 하되, 주문 기능 자체는 막지 않는다 (서버가 최종 검증).
- 화면 이탈 시 반드시 구독 해제한다.

### 보유 자산 화면

이번 범위에서는 REST 조회만 사용한다. 화면 진입 시 1회 조회, 필요 시 당겨서 새로고침.

---

## 6. 미확정 / 후속

- STOMP 토픽 경로·payload 필드명 — 기존 백엔드 구현 기준으로 확정 필요
- 다중 종목 동시 구독 방식 (보유 자산 화면 실시간화 시)
- `PENDING` 주문의 체결 알림을 클라이언트에 푸시할지 여부
- `account_daily_snapshots` 생성 배치와 매매의 연동 시점
- 종목 검색 API (매매 화면 진입 경로)
