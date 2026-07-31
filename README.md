# KB 프로젝트 - 꼬비

## 프로젝트 소개

꼬비는 사용자의 금융 성향을 분석하고 맞춤형 금융 정보를 제공하는 KB 금융
프로젝트입니다.

이 저장소는 Vue 3 기반의 프론트엔드 프로젝트로, Vite, Vue Router, Pinia,
Tailwind CSS, JavaScript를 사용합니다.

## 기술 환경

| 구분 | 버전 또는 구성 |
| --- | --- |
| 운영체제 | 버전 고정 없음 |
| 언어 | JavaScript |
| Node.js | 24.18.0 |
| Node.js 호환 범위 | `^22.18.0 || >=24.12.0` |
| 패키지 관리 | npm 및 `package-lock.json` |
| 프레임워크 | Vue 3.6.0-rc.2 |
| 빌드 도구 | Vite 8.1.5 |
| 라우팅 | Vue Router 5.2.0 |
| 상태 관리 | Pinia 4.0.2 |
| 스타일 | Tailwind CSS 3.4.19, PostCSS 8.5.25 |
| Vue 플러그인 | `@vitejs/plugin-vue` 6.0.8 |
| 개발 도구 | `vite-plugin-vue-devtools` 8.2.1 |

Node.js 버전은 프로젝트 루트의 `.nvmrc`에 지정된 24.18.0을 기준으로
사용합니다. `package.json`의 `engines`에는 프로젝트가 지원하는 Node.js 버전
범위가 정의되어 있습니다.

## 로컬 실행 방법

### Node.js 버전 확인

저장소 루트에서 다음 명령을 실행해 Node.js와 npm 버전을 확인합니다.

```sh
node --version
npm --version
```

Node.js 버전은 `v24.18.0`이어야 합니다.

### 의존성 설치

`package-lock.json`에 기록된 버전 그대로 의존성을 설치합니다.

```sh
npm ci
```

`package-lock.json`이 존재하므로 일반적인 개발 환경 구성에서는 `npm install`
대신 `npm ci`를 우선 사용합니다.

### 개발 서버 실행

```sh
npm run dev
```

터미널에 표시되는 로컬 주소로 접속합니다.

### 운영 빌드 확인

```sh
npm run build
```

빌드 결과는 `dist/` 디렉터리에 생성됩니다.

### 빌드 결과 미리 보기

```sh
npm run preview
```

PowerShell 실행 정책으로 `npm.ps1` 실행이 차단되는 경우 동일한 명령을 다음과
같이 `npm.cmd`로 실행할 수 있습니다.

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd run build
npm.cmd run preview
```

## Docker 환경 안내

현재 프론트엔드 저장소에는 Docker 및 Nginx 실행 환경을 구성하지 않습니다.
Dockerfile 작성, 이미지 빌드, 컨테이너 실행, Nginx 설정은 학습 후 별도
이슈에서 처음부터 진행합니다.

이번 환경 정리에서는 Node.js와 npm을 사용하는 로컬 개발 방법만 다룹니다.

## 프로젝트 구조

```text
frontend/
├── .githooks/
│   └── commit-msg                 # 커밋 메시지 검사 Hook
├── public/
│   └── favicon.ico                # 정적 리소스
├── src/
│   ├── api/
│   │   ├── http.js                # HTTP 클라이언트 공통 설정
│   │   ├── investApi.js           # 투자 관련 API
│   │   └── mainApi.js             # 메인 화면 관련 API
│   ├── assets/
│   │   └── main.css               # 전역 스타일과 Tailwind 지시문
│   ├── components/
│   │   └── common/                # 공통 버튼, 카드, 모달 및 레이아웃
│   ├── router/
│   │   └── index.js               # Vue Router 설정
│   ├── stores/
│   │   ├── assessment.js          # 금융 성향 분석 상태
│   │   ├── auth.js                # 인증 상태
│   │   └── invest.js              # 투자 관련 상태
│   ├── views/
│   │   ├── HomeView.vue           # 홈 화면
│   │   ├── LeaderboardView.vue    # 리더보드 화면
│   │   ├── MyPageView.vue         # 마이페이지 화면
│   │   ├── ProductsView.vue       # 금융 상품 화면
│   │   └── VirtualInvestView.vue  # 가상 투자 화면
│   ├── App.vue                    # 최상위 컴포넌트
│   └── main.js                    # 애플리케이션 진입점
├── .nvmrc                         # 프로젝트 Node.js 버전
├── index.html                     # Vite HTML 진입점
├── jsconfig.json                  # JavaScript 경로 및 편집기 설정
├── package.json                   # npm 스크립트와 의존성
├── package-lock.json              # 고정된 의존성 버전
├── postcss.config.js              # PostCSS 설정
├── tailwind.config.js             # Tailwind CSS 설정
└── vite.config.js                 # Vite 플러그인과 경로 별칭 설정
```

새로운 화면은 `views`, 여러 화면에서 재사용하는 UI는 `components/common`
디렉터리에 추가합니다.

## Git Hook 설정

커밋 메시지 검증을 위해 `.githooks/commit-msg` Hook을 사용합니다.

저장소를 처음 받은 뒤 저장소 루트에서 다음 명령을 한 번 실행합니다.

```sh
git config core.hooksPath .githooks
```

현재 설정은 다음 명령으로 확인할 수 있습니다.

```sh
git config core.hooksPath
```

출력값이 `.githooks`이면 정상적으로 설정된 상태입니다.

커밋 메시지는 다음 형식을 사용합니다.

```text
#{이슈번호} {Type} : {작업 내용}
```

예:

```text
#7 Chore : 프론트엔드 로컬 개발 환경 정리
```

## 협업 규칙

### 브랜치 규칙

#### `main`

- 운영 브랜치
- 항상 배포 가능한 상태 유지
- 직접 push하지 않고 PR을 통해 병합

#### `develop`

- 개발 통합 브랜치
- 작업 브랜치는 `develop`에서 분기
- 작업 완료 후 `develop`으로 PR 생성

#### `feature/{도메인}-{작업내용}`

- 새로운 기능 개발
- 예: `feature/member-login`
- 예: `feature/game-event-generation`

#### `fix/{도메인}-{작업내용}`

- 버그 수정
- 예: `fix/assessment-score-calculation`

#### `refactor/{도메인}-{작업내용}`

- 기능 변화가 없는 코드 개선

#### `chore/{작업내용}`

- 빌드 및 설정 변경

#### `docs/{작업내용}`

- 문서 추가 또는 수정

도메인 접두어는 프로젝트 구조에 맞춰 다음과 같이 사용합니다.

- `member`
- `assessment`
- `game`
- `backtest`
- `product`
- `leaderboard`
- `tracking`
- `security`
- `common`

병합이 끝난 작업 브랜치는 삭제합니다.

### 이슈 규칙

- 모든 작업은 이슈를 등록한 뒤 진행합니다.
- 이슈 제목은 `{Type} : {작업 내용 요약}` 형식으로 작성합니다.
- 이슈 본문에는 작업 배경, 목표, 작업 체크리스트를 포함합니다.
- 담당 도메인에 맞는 라벨을 지정합니다.
- PR 본문에 `Closes #이슈번호`를 작성해 병합 시 관련 이슈가 닫히도록 합니다.

이슈 작성 예시:

```markdown
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

| Type | 설명 |
| --- | --- |
| `Feat` | 새로운 기능 추가 |
| `Fix` | 버그 수정 |
| `Refactor` | 기능 변화가 없는 코드 개선 |
| `Design` | CSS 등 UI 또는 디자인 변경 |
| `Style` | 포맷팅 등 기능에 영향이 없는 변경 |
| `Docs` | 문서 추가 또는 수정 |
| `Test` | 테스트 코드 추가 또는 수정 |
| `Chore` | 빌드, 설정, 패키지 관리 변경 |
| `Comment` | 주석 추가 또는 수정 |
| `Rename` | 파일이나 디렉터리 이름 변경 또는 이동 |
| `Remove` | 파일 삭제 |

- 커밋은 하나의 논리적 작업 단위로 작게 나눕니다.
- 메시지는 한글로 작성하고 무엇을 변경했는지 명확하게 표현합니다.
- 첫 줄 맨 앞에 관련 이슈 번호를 `#{이슈번호}` 형식으로 작성합니다.

```text
#1 Feat : 회원가입 시 이메일 중복 검증 로직 추가
```

## 권장 개발 도구

- 편집기: [VS Code](https://code.visualstudio.com/)와
  [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- Chromium 기반 브라우저:
  [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- Firefox:
  [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

Vite 설정에 관한 자세한 내용은
[Vite 설정 문서](https://vite.dev/config/)를 참고합니다.
