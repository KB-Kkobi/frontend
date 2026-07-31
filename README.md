# KB 프로젝트 - 꼬비

결에 맞는 투자 '결투' 프론트엔드 프로젝트입니다.


## 기술 스택

### Core

- **[Vue 3](https://vuejs.org/)** - `<script setup>` 방식의 SFC(Single File Component)를 사용하는 프론트엔드 프레임워크
- **[Vite](https://vite.dev/)** - 개발 서버 및 번들러
- **[Vue Router](https://router.vuejs.org/)** - SPA 클라이언트 사이드 라우팅
- **[Pinia](https://pinia.vuejs.org/)** - 상태 관리 라이브러리

### 개발 도구

- **[@vitejs/plugin-vue](https://github.com/vitejs/vite-plugin-vue)** - Vite에서 Vue SFC(`.vue`)를 처리하기 위한 플러그인
- **[vite-plugin-vue-devtools](https://devtools-next.vuejs.org/)** - 개발 중 컴포넌트/상태/라우터를 확인할 수 있는 Vue Devtools 통합
- **jsconfig.json + `@` alias** - `src/` 경로를 `@`로 임포트할 수 있도록 설정 (`vite.config.js`에서 정의)

## 프로젝트 구조

```
src/
├── api/          # 서버 통신 관련 모듈 (axios 등 HTTP 클라이언트, API 함수)
├── assets/       # 전역 스타일, 이미지 등 정적 리소스
├── router/       # Vue Router 라우트 설정
├── stores/       # Pinia 스토어 (전역 상태 관리)
├── views/        # 라우트에 매핑되는 페이지 컴포넌트
├── App.vue       # 최상위 루트 컴포넌트
└── main.js       # 앱 진입점 (Vue 앱 생성, 플러그인 등록)
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (Vetur는 비활성화 권장)

## Recommended Browser Setup

- Chromium 기반 브라우저 (Chrome, Edge, Brave 등):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - Chrome DevTools에서 Custom Object Formatter 활성화
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - Firefox DevTools에서 Custom Object Formatter 활성화

## Customize configuration

[Vite Configuration Reference](https://vite.dev/config/) 참고

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Locally Preview Production Build

```sh
npm run preview
```
