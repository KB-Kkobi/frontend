# 누리 프론트엔드 — AI 에이전트 지침

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
| 카테고리 강조 텍스트     | `text-blue` · `text-green` · `text-yellow` · `text-lavender` · `text-cream` |
| 컨테이너 배경(옅은 틴트) | `bg-pink-soft` · `bg-blue-soft` · `bg-green-soft` · `bg-yellow-soft` · `bg-lavender-soft` · `bg-cream-soft` |
| 수익 / 상승              | `text-profit` (핑크)                                                 |
| 손실 / 하락              | `text-loss` (블루)                                                   |
| 성공 / 에러 알림         | `text-success` · `text-error`                                        |
| 제목·본문 텍스트         | `text-ink`                                                           |
| 강조 제목(네이비)        | `text-navy` — 리포트류 화면의 큰 강조 타이틀 전용                    |
| 보조 텍스트              | `text-muted`                                                         |
| 테두리·구분선            | `border-line` · `border-line-soft`(BaseCard 흰색 전용, 크림톤)       |
| 카드 배경                | `bg-surface`                                                         |
| 세그먼트 트랙 배경       | `bg-segment`                                                         |
| 페이지 배경              | `bg-page` · `bg-page-warm`(옅은 아이보리→흰색 그라데이션) · `bg-base`(옅은 아이보리 단색) |

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
| `PageContainer` | 페이지 폭 고정 + 좌우 여백. 모든 View의 최상단 래퍼. `color` prop(`page` 기본값 / `page-warm` / `base` / `white`)으로 배경 선택 |
| `PageHeader`    | 최상위 탭 화면의 중앙 제목과 선택 설명. `title` 필수, `description` 선택 prop                              |
| `BaseCard`      | 둥근 컨테이너(`rounded-3xl p-4`). `color`로 배경, `elevation`(`flat`/`default`/`highlight`)으로 흰 카드 깊이 선택 |
| `BaseModal`     | 확인·취소 이중확인 모달. `v-model` + `message`/`confirmText`/`cancelText` prop, `@confirm`/`@cancel` emit |
| `BottomButton`  | 하단·행동 버튼. `color` prop으로 스타일 선택, `shape` prop(`rounded` 기본값 / `pill`)으로 모서리 형태 선택 |
| `BackButton`    | 뒤로가기 버튼                                                                                             |
| `TabBar`        | 상단 밑줄형 세그먼트 탭. `tabs` 배열 + `v-model`로 선택 상태 관리                                         |
| `BottomTabBar`  | 하단 탭 네비게이션                                                                                        |
| `BasePill`      | 짧은 라벨 배지(pill). `label` + `color`(`pink`/`blue`/`green`/`yellow`/`lavender`) + `variant`(`filled`/`outline`/`ghost`) + `as`(`span`/`button`) + `fullWidth` + `disabled` prop. `ghost`=`bg-surface text-muted font-normal` |

- 새 컴포넌트를 만들기 전에 이 목록부터 확인.
- 부족한 변형이 필요하면 컴포넌트를 확장(새 `props` 값 추가)하지, 사용처에서 클래스 override로 우회하지 말 것.
- **도메인 컴포넌트는 `src/components/<도메인>/`** (예: `security/SecuritySummaryCard.vue`). 공통 컴포넌트(`BaseCard` 등)를 컨테이너로 재사용하고 `rounded`/`p-*`을 다시 박지 말 것.

### 도메인 컴포넌트

| 컴포넌트              | 위치                               | 용도                                                                                        |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `SecuritySummaryCard` | `security/SecuritySummaryCard.vue` | 종목 현재가·등락·차트·기간 선택                                                             |
| `HoldingCard`         | `security/HoldingCard.vue`         | 보유 수량·평균단가·평가수익률. `quantity`, `avgPrice`, `currentPrice` props                 |
| `SecurityInsightCard` | `security/SecurityInsightCard.vue` | "알아두면 좋아요" 인사이트 카드. `period`, `productName`, `averageDailyMove`, `maxDrawdown`, `description` props |
| `PriceChart`          | `security/PriceChart.vue`          | 캔들스틱 차트(lightweight-charts). `code`(6자리) + `period`(D/W/M) props, 기간에 따라 자동 재조회 |
| `TransactionCard`     | `transaction/TransactionCard.vue`  | 거래 내역·대기 주문 공통 카드. `name`/`subLabel`/`pill`/`datetime`/`stats`/`isCancelable`/`cancelText` props, `@cancel` emit |
| `MyPageMenuCard`      | `mypage/MyPageMenuCard.vue`         | 마이페이지의 아이콘·라벨 메뉴 목록. `items` prop, `@select` emit                                |
| `TradeSideToggle`     | `trade/TradeSideToggle.vue`         | 매수/매도 전체 폭 세그먼트 토글. `side`('buy'\|'sell') prop, `@update:side` emit. 매수=bg-pink, 매도=bg-surface |
| `TradeStockHeader`    | `trade/TradeStockHeader.vue`        | 종목 헤더 카드(BaseCard). `name`/`code`/`currentPrice`/`changeRate` props. name=종목명(text-h2), code=종목코드(text-caption text-muted, 선택). 등락률 양수=text-profit, 음수=text-loss |
| `TradeMethodToggle`   | `trade/TradeMethodToggle.vue`       | 시장가/지정가 세그먼트 토글. `method`('market'\|'limit') prop, `@update:method` emit. 선택=bg-yellow |
| `TradePriceInput`     | `trade/TradePriceInput.vue`         | 1주당 가격 입력. `method`/`marketPrice`/`modelValue` props, `@update:modelValue` emit. 시장가=읽기전용 bg-surface |
| `TradeQuantityInput`  | `trade/TradeQuantityInput.vue`      | 수량 스텝퍼 + 빠른 선택 pill(1주/5주/10주/최대). `modelValue`/`maxQuantity` props, `@update:modelValue` emit. 스텝퍼 테두리=border-pink, 선택 pill=bg-yellow |
| `TradeOrderSummary`   | `trade/TradeOrderSummary.vue`       | 주문 요약(주문가능금액/매도가능수량·단가×수량·주문금액). `orderableCash`/`pricePerShare`/`quantity`/`orderAmount`/`side`/`sellableQuantity` props |
| `TradePortfolioImpact`| `trade/TradePortfolioImpact.vue`    | 포트폴리오 영향 섹션. 비중 프로그레스바(bg-yellow) + 권장 세로선(bg-ink) + 초과 경고(bg-yellow-soft). `currentRatio`/`afterRatio`/`recommendedRatio`/`show` props. null 또는 show=false면 전체 숨김 |
| `AssetCompositionCard` | `virtual/AssetCompositionCard.vue` | 자산 구성 카드(현금·주식·예금적금 비율 표시). `cashBalance`/`cashRatio`/`stockAsset`/`stockRatio`/`savingsAsset`/`savingsRatio` props |
| `AssetCompositionRow`  | `virtual/AssetCompositionRow.vue`  | 자산 구성 행(라벨+금액+비율). `label`/`amount`/`ratio`/`amountClass`(기본 `text-ink`) props |
| `LeaderboardRankRow`   | `leaderboard/LeaderboardRankRow.vue` | 리더보드 순위 행 카드. `rank`/`nickname`/`personaName`/`totalAsset`/`returnRate`/`isMe` props. 1~3위는 순위 숫자를 `text-h2 font-bold`로 강조, 4위 이하는 `text-body text-muted`. `isMe`면 `BaseCard color="pink"`(그림자 없음)로 배경 강조 + `BasePill` "나" 배지(`variant="outline"`) 표시 |

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

## 협업 규칙

### 브랜치 규칙

| 브랜치                     | 용도                                                        |
| --------------------------- | ------------------------------------------------------------ |
| `main`                      | 운영 브랜치. 항상 배포 가능한 상태 유지. 직접 push 금지, PR로만 병합 |
| `develop`                   | 개발 통합 브랜치. 작업 브랜치는 여기서 분기, 완료 후 여기로 PR |
| `feature/{도메인}-{작업내용}` | 새로운 기능 개발. 예: `feature/member-login`, `feature/game-event-generation` |
| `fix/{도메인}-{작업내용}`     | 버그 수정. 예: `fix/assessment-score-calculation`             |
| `refactor/{도메인}-{작업내용}`| 기능 변화가 없는 코드 개선                                    |
| `chore/{작업내용}`           | 빌드 및 설정 변경                                             |
| `docs/{작업내용}`            | 문서 추가 또는 수정                                           |

- 도메인 접두어: `member` · `assessment` · `game` · `backtest` · `product` · `leaderboard` · `tracking` · `security` · `common`
- 병합이 끝난 작업 브랜치는 삭제한다.

### 이슈 규칙

- 모든 작업은 이슈를 등록한 뒤 진행한다.
- 이슈 제목: `{Type} : {작업 내용 요약}`.
- 이슈 본문: 작업 배경, 목표, 작업 체크리스트 포함.
- 담당 도메인에 맞는 라벨 지정.
- PR 본문에 `Closes #이슈번호`를 작성해 병합 시 관련 이슈가 자동으로 닫히게 한다.

작성 예시:

```
제목: Feat : 금융 상품 화면 구현
라벨: product

## 배경

사용자가 금융 상품 정보를 탐색할 수 있는 화면이 필요합니다.

## 목표

- 금융 상품 목록 제공
- 상품별 주요 정보 표시

## 작업 내용

- [ ] 금융 상품 화면 구성
- [ ] 상품 카드 공통 컴포넌트 적용
- [ ] 금융 상품 API 연동
- [ ] 정상 및 오류 사례 확인
```

### 커밋 규칙

| Type       | 설명                                   |
| ---------- | -------------------------------------- |
| `Feat`     | 새로운 기능 추가                        |
| `Fix`      | 버그 수정                               |
| `Refactor` | 기능 변화가 없는 코드 개선              |
| `Design`   | CSS 등 UI 또는 디자인 변경              |
| `Style`    | 포맷팅 등 기능에 영향이 없는 변경       |
| `Docs`     | 문서 추가 또는 수정                     |
| `Test`     | 테스트 코드 추가 또는 수정              |
| `Chore`    | 빌드, 설정, 패키지 관리 변경            |
| `Comment`  | 주석 추가 또는 수정                     |
| `Rename`   | 파일이나 디렉터리 이름 변경 또는 이동   |
| `Remove`   | 파일 삭제                               |

- 커밋은 하나의 논리적 작업 단위로 작게 나눈다.
- 메시지는 한글로 작성하고 무엇을 변경했는지 명확하게 표현한다.
- 첫 줄 맨 앞에 관련 이슈 번호를 `#{이슈번호}` 형식으로 작성한다.
  - 예: `#1 Feat : 회원가입 시 이메일 중복 검증 로직 추가`

### 권장 개발 도구

- 편집기: VS Code + Vue - Official 확장
- 브라우저 devtools: Chromium 계열은 Vue.js devtools, Firefox도 Vue.js devtools
- Vite 설정은 [Vite 설정 문서](https://vitejs.dev/config/) 참고

---

> 토큰 값의 원본은 `tailwind.config.js`. 토큰이 바뀌면 이 파일과 함께 업데이트.

## 확정 디자인 시스템

성향 진단 리포트의 차분한 아이보리 배경과 흰색 카드 조합을 전체 앱의 기준으로 사용한다. 색상 비중은 따뜻한 거의 흰색 배경 60%, 흰색 또는 옅은 틴트 카드 30%, 핑크 행동 강조 10%를 원칙으로 한다.

### 배경과 카드

- 앱 외부 배경은 `bg-white`, 앱 내부 페이지 배경은 `bg-page`(`#FDFDFD`)를 사용한다.
- `bg-page-warm`은 기존 화면 호환용 별칭이다. 새 화면에서는 사용하지 않는다.
- 일반 흰색 카드는 `<BaseCard color="white">`를 사용한다. 기본값은 윤곽선 없이 `shadow-card`를 사용한다.
- elevation이 필요 없는 단순 목록은 `<BaseCard color="white" elevation="flat">`을 사용하며 `border-line-soft` 윤곽선만 표시한다.
- 핵심 요약 카드에만 `<BaseCard color="white" elevation="highlight">`을 허용한다. 한 화면에 반복 사용하지 않는다.
- 정보·성공·경고 카드는 각각 `blue-soft`, `green-soft`, `yellow-soft`를 의미가 있을 때만 사용하며 그림자를 적용하지 않는다.
- `pink-soft`는 브랜드 선택이나 제한적인 강조에만 사용한다. 넓은 페이지 영역이나 반복 카드 배경으로 사용하지 않는다.
- 팝업은 `bg-white shadow-popup`을 사용한다. `shadow-popup`은 일반 콘텐츠 카드에 사용하지 않는다.

### 경계와 그림자

- `border-line`은 입력창과 버튼처럼 조작 경계가 분명해야 하는 요소에 사용한다.
- `border-line-soft`는 카드 외곽선과 카드 내부 구분선에 사용한다.
- `shadow-card`는 `develop` 기준의 크림 톤 그림자다.
- `shadow-highlight`는 화면의 핵심 카드 한정이며 `develop`과 같은 그림자 값을 사용한다.
- `shadow-popup`은 모달과 팝업 레이어 전용이며 `develop`과 같은 그림자 값을 사용한다.
- 그림자가 적용된 카드에는 윤곽선을 사용하지 않는다.

### 텍스트와 행동

- 페이지 제목은 `text-h1 text-ink`, 섹션 제목은 `text-h2 text-ink`를 사용한다.
- 본문은 `text-body text-ink`, 보조 문구는 `text-caption text-muted`를 사용한다.
- `text-navy`는 성향 리포트의 핵심 유형명처럼 제한된 강조 제목에만 사용한다.
- 주요 행동은 `<BottomButton color="pink">`, 보조 행동은 `<BottomButton color="white">`를 사용한다.
- 블루·그린·옐로우 버튼은 각각 손실·매도, 성공, 경고처럼 색 의미가 명확한 경우에만 사용한다.
- 오류에는 `text-error`, 수익과 손실 수치에는 각각 `text-profit`, `text-loss`를 사용한다. 핑크 틴트 카드를 오류 표현으로 대체하지 않는다.

### 공통 컴포넌트

- 최상위 탭 화면의 중앙 제목과 설명은 `PageHeader`를 사용한다.
- 상세 화면의 뒤로가기 헤더는 `PageHeader`를 변형하지 않고 별도 상세 헤더 구조를 유지한다.
- 공통 컴포넌트를 사용하는 화면에서 배경, 그림자, 윤곽선, radius를 임의 클래스로 덮어쓰지 않는다.
