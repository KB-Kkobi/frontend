# 결투 프론트엔드 — AI 에이전트 지침

투자 초보자용 **성향 맞춤 포트폴리오 체험 서비스**. 모바일 우선.
하단 탭: 홈 / 상품 / 가상투자 / 리더보드 / 마이페이지

## 스택

- Vue 3 (`<script setup>`, Composition API)
- Vite
- Tailwind CSS (아래 디자인 토큰 사용)

## 절대 규칙

1. **토큰·공통 컴포넌트 우선 사용, 원시값 하드코딩 금지.** 정의된 토큰(색·타이포·간격)과 `src/components/common/`의 컴포넌트를 먼저 사용한다. 필요한 게 없거나 부족하면 **먼저 `tailwind.config.js`와 이 파일(CLAUDE.md)을 확장**한 뒤 그 토큰으로 사용한다. 컴포넌트에 hex(`#abc`)·px(`text-[15px]`)·임의값(`bg-[#F4F4FB]`) 등을 박아넣거나, 공통 컴포넌트를 사용처에서 override 하지 말 것.
2. 글자 굵기는 `font-normal` / `font-semibold` / `font-bold` **3개만**.
3. **그림자는 `shadow-card`(BaseCard 흰색 변형 전용) 외에는 사용 안 함.**
4. **간격은 정해진 값만** 사용. 컴포넌트는 **자기 `margin`을 갖지 않는다** — 바깥 간격은 부모가 `gap`으로 관리.
5. 컴포넌트는 재사용 가능하게, 변형은 `props`로 관리.
6. 모바일 우선.

## 색상 토큰

| 용도                     | 클래스                                                               |
| ------------------------ | -------------------------------------------------------------------- |
| 주색 버튼·강조           | `bg-pink` · `text-pink`                                              |
| 카테고리 강조 텍스트     | `text-blue` · `text-green` · `text-yellow`                           |
| 컨테이너 배경(옅은 틴트) | `bg-pink-soft` · `bg-blue-soft` · `bg-green-soft` · `bg-yellow-soft` |
| 수익 / 상승              | `text-profit` (핑크)                                                 |
| 손실 / 하락              | `text-loss` (블루)                                                   |
| 성공 / 에러 알림         | `text-success` · `text-error`                                        |
| 제목·본문 텍스트         | `text-ink`                                                           |
| 보조 텍스트              | `text-muted`                                                         |
| 테두리·구분선            | `border-line` · `border-line-soft`(BaseCard 흰색 전용, 크림톤)       |
| 카드 배경                | `bg-surface`                                                         |
| 페이지 배경              | `bg-page`(그라데이션) · `bg-base`(단색)                              |

## 타이포그래피

크기·행간·굵기가 클래스 하나에 묶여 있음.

| 역할               | 클래스                       |
| ------------------ | ---------------------------- |
| 자산 금액(큰 숫자) | `text-amount`                |
| 제목 / 서브제목    | `text-h1` · `text-h2`        |
| 본문 / 보조        | `text-body` · `text-caption` |
| 버튼 라벨          | `text-button`                |

- 금액·수익률 숫자엔 `tabular-nums` + `+`/`-` 기호를 함께 표기.
- 한글 본문은 `tracking-tight` 권장.

## 간격 · 레이아웃

- 허용 값만: `gap-2`(8px) / `gap-4`(16px) / `gap-6`(24px), 카드 `p-4`, 버튼 `py-3 px-4`, 페이지 좌우 `px-5`, 모달 `pt-8 px-4 pb-4`(상단만 32px로 여유), pill `py-pill-y px-pill-x`(6px × 12px), 세그먼트 트랙 `p-segment-p`(4px). 어중간한 값(`p-3.5`, `mt-7`) 금지.
- 컴포넌트 사이 간격은 부모가 `flex flex-col gap-*`으로 관리 (컴포넌트에 `margin` 넣지 않기).
- 페이지는 `PageContainer`로 폭 고정 → `mx-auto w-full max-w-[430px] px-5`. breakpoint(`sm:` 등) 거의 불필요.

## 공통 컴포넌트

`src/components/common/`에 있는 것부터 사용. 없으면 여기에 추가하고 이 표를 갱신.

| 컴포넌트        | 용도                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `PageContainer` | 페이지 폭 고정 + 좌우 여백. 모든 View의 최상단 래퍼                                                       |
| `BaseCard`      | 둥근 컨테이너(`rounded-3xl p-4`). `color` prop으로 배경 선택                                              |
| `BaseModal`     | 확인·취소 이중확인 모달. `v-model` + `message`/`confirmText`/`cancelText` prop, `@confirm`/`@cancel` emit |
| `BottomButton`  | 하단·행동 버튼. `color` prop으로 스타일 선택                                                              |
| `BackButton`    | 뒤로가기 버튼                                                                                             |
| `TabBar`        | 상단 밑줄형 세그먼트 탭. `tabs` 배열 + `v-model`로 선택 상태 관리                                         |
| `BottomTabBar`  | 하단 탭 네비게이션                                                                                        |
| `BasePill`      | 짧은 라벨 배지(pill). `label` + `color`(`pink`/`blue`/`green`/`yellow`) + `variant`(`filled`/`outline`/`ghost`) + `as`(`span`/`button`) prop. `ghost`=`bg-surface text-muted font-normal` |

- 새 컴포넌트를 만들기 전에 이 목록부터 확인.
- 부족한 변형이 필요하면 컴포넌트를 확장(새 `props` 값 추가)하지, 사용처에서 클래스 override로 우회하지 말 것.
- **도메인 컴포넌트는 `src/components/<도메인>/`** (예: `security/SecuritySummaryCard.vue`). 공통 컴포넌트(`BaseCard` 등)를 컨테이너로 재사용하고 `rounded`/`p-*`을 다시 박지 말 것.

### 도메인 컴포넌트

| 컴포넌트              | 위치                               | 용도                                                                                        |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `SecuritySummaryCard` | `security/SecuritySummaryCard.vue` | 종목 현재가·등락·차트·기간 선택                                                             |
| `HoldingCard`         | `security/HoldingCard.vue`         | 보유 수량·평균단가·평가수익률. `quantity`, `avgPrice`, `currentPrice` props                 |
| `SecurityInsightCard` | `security/SecurityInsightCard.vue` | "알아두면 좋아요" 인사이트 카드. `period`, `volatility`, `maxDrawdown`, `description` props |
| `PriceChart`          | `security/PriceChart.vue`          | 캔들스틱 차트(lightweight-charts). `code`(6자리) + `period`(D/W/M) props, 기간에 따라 자동 재조회 |
| `TransactionCard`     | `transaction/TransactionCard.vue`  | 거래 내역·대기 주문 공통 카드. `name`/`subLabel`/`pill`/`datetime`/`stats`/`isCancelable`/`cancelText` props, `@cancel` emit |
| `MyPageMenuCard`      | `mypage/MyPageMenuCard.vue`         | 마이페이지의 아이콘·라벨·이동 화살표 메뉴 목록. `items` prop, `@select` emit                    |

## 개발 컨벤션

### 폴더 구조

```
src/
├── assets/         # CSS·이미지·폰트
├── components/     # 재사용 컴포넌트 (Base*, 공통 UI, 도메인별 하위 폴더 가능)
├── views/          # 라우트 단위 화면
├── composables/    # 재사용 로직 (use*)
├── stores/         # 상태관리 (Pinia)
├── api/            # 서버 통신
├── utils/          # 순수 함수 유틸
├── constants/      # 상수
└── router/         # 라우팅
```

- import는 상대경로(`../../`) 대신 `@/` alias 사용.
- 파일당 1컴포넌트, 파일당 1책임.

### 네이밍

| 대상               | 규칙                        | 예시                            |
| ------------------ | --------------------------- | ------------------------------- |
| 컴포넌트 파일·이름 | PascalCase                  | `AssetCard.vue`                 |
| 공통 기본 컴포넌트 | `Base` 접두사               | `BaseButton.vue`                |
| 화면(뷰)           | PascalCase + `View`         | `HomeView.vue`                  |
| composable         | `use` + camelCase           | `usePortfolio.js`               |
| store              | `use` + camelCase + `Store` | `usePortfolioStore`             |
| util·일반 함수     | camelCase (동사+명사)       | `formatCurrency`                |
| API 함수           | 동사+명사                   | `fetchPortfolio`, `createOrder` |
| 변수               | camelCase                   | `totalAmount`                   |
| 상수               | UPPER_SNAKE_CASE            | `MAX_RETRY`                     |
| boolean            | `is`/`has`/`should` 접두사  | `isLoading`, `hasError`         |
| 이벤트 핸들러      | `handle` 접두사             | `handleSubmit`                  |
| emit 이벤트        | kebab-case 동사             | `@select`, `@update`            |
| 폴더명             | 소문자                      | `components/`                   |

### 함수

- 한 함수는 **한 가지 일**만. 길어지면(대략 30줄+) 분리.
- 서버 통신 → `api/`, 순수 계산 → `utils/`, UI 상태 로직 → `composables/`로 분리.
- 매직 넘버·문자열은 `constants/`로 빼기.
- `props` / `emit`은 명시적으로 선언.

### 컴포넌트(SFC) 구조

- 블록 순서: `<script setup>` → `<template>` → `<style scoped>`.
- `<script setup>` 내부 순서: props/emits → composables·store → 반응형 상태 → computed → watch → 함수 → lifecycle.
- 스타일은 `scoped` 기본 (전역 스타일은 `main.css`에만).

### import 순서

1. Vue·외부 라이브러리 → 2. 내부 모듈(`@/`) → 3. 상대경로 → 4. 스타일

---

> 토큰 값의 원본은 `tailwind.config.js`. 토큰이 바뀌면 이 파일과 함께 업데이트.
