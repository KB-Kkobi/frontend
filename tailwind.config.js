/**
 * 누리 디자인 토큰 — Tailwind Config
 * -------------------------------------------------------------
 * 팀 공통 팔레트 / 타이포. 원시 hex(#FF6B9D 등)를 직접 쓰지 말고
 * 아래 시맨틱 클래스를 사용하세요.
 *   색   : bg-pink, bg-pink-soft, text-blue, text-profit, border-line ...
 *   글자 : text-h1, text-body, text-amount, text-caption ...
 *   배경 : bg-page(그라데이션), bg-base(단색), bg-surface(카드)
 * -------------------------------------------------------------
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    // 팔레트를 완전히 교체 → "정의된 색만" 쓰도록 강제합니다.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      black: "#000000", // 본문 텍스트엔 쓰지 말고 text-ink 사용

      // ── 브랜드 4색 (DEFAULT = 버튼·강조, soft = 컨테이너 배경) ──
      pink: { DEFAULT: "#FF6B9D", soft: "#FEF2F6" }, // 핑크 (주색)
      blue: { DEFAULT: "#5B8BF7", soft: "#F0F5FE" },
      green: { DEFAULT: "#55C770", soft: "#EFFAF7" },
      yellow: { DEFAULT: "#FED063", soft: "#FEF7E0" },
      lavender: { DEFAULT: "#9B8EDB", soft: "#F1ECFB" },
      cream: { DEFAULT: "#FBDD84", soft: "#FDF1CE" },

      // ── 강조 텍스트 전용 (버튼에는 쓰지 않음) ──
      navy: "#1E2A5E",

      // ── 의미 색 (금액·수치·알림 전용) ──
      profit: "#FF6B9D", // 수익 / 상승 = 핑크
      loss: "#5B8BF7", // 손실 / 하락 = 블루
      success: "#55C770",
      error: "#E5484D", // 핑크와 확실히 구분되는 정통 빨강

      // ── 중립색 (회색 4 + 배경 1) ──
      ink: "#1F2430", // 제목·본문 텍스트
      muted: "#8B8A85", // 보조 텍스트·placeholder
      line: { DEFAULT: "#E4E3E0", soft: "#ECEEF1" }, // 중성 윤곽선과 카드 내부 구분선
      surface: "#F5F4F2", // 카드 배경
      segment: "#F5F5F5", // 세그먼트 선택바 트랙 배경
      base: "#FDFDFD", // 앱 내부 단색 페이지 배경
    },

    extend: {
      fontFamily: {
        sans: ["Pretendard", "system-ui", "-apple-system", "sans-serif"],
      },

      // 크기 + 행간 + 굵기를 한 클래스에 묶은 시맨틱 텍스트 스타일
      fontSize: {
        amount: ["28px", { lineHeight: "1.3", fontWeight: "700" }], // 자산 금액(큰 숫자)
        h1: ["20px", { lineHeight: "1.35", fontWeight: "600" }], // 제목
        h2: ["16px", { lineHeight: "1.4", fontWeight: "600" }], // 서브제목
        body: ["15px", { lineHeight: "1.5", fontWeight: "400" }], // 본문
        caption: ["13px", { lineHeight: "1.4", fontWeight: "400" }], // 보조·캡션
        button: ["15px", { lineHeight: "1", fontWeight: "600" }], // 버튼 라벨
      },

      letterSpacing: {
        tight: "-0.01em", // 한글 본문 권장 자간
      },

      backgroundImage: {
        // 페이지 배경 그라데이션 (옅은 아이보리 → 흰색)
        page: "linear-gradient(180deg, #FDFDFD 0%, #FDFDFD 100%)",
        // 리포트류 화면도 동일한 배경 톤 사용
        "page-warm": "linear-gradient(180deg, #FDFDFD 0%, #FDFDFD 100%)",
      },

      spacing: {
        "pill-y": "6px",
        "pill-x": "12px",
        "segment-p": "4px",
        "tutorial-card-y": "6px",
      },

      maxHeight: {
        sheet: "90dvh",
        "tutorial-card": "38dvh",
      },

      gridTemplateColumns: {
        "tutorial-card": "minmax(0, 96px) minmax(0, 1fr)",
      },

      boxShadow: {
        // 흰색 카드와 팝업이 배경에서 부드럽게 분리되는 중성 elevation
        card: "0 10px 26px 0 rgba(214, 180, 90, 0.09)",
        highlight: "0 10px 26px 0 rgba(214, 180, 90, 0.09)",
        popup: "0 10px 26px 0 rgba(214, 180, 90, 0.09)",
        // 어둡게 딤 처리된 배경(게임 튜토리얼 오버레이) 위에 뜨는 카드용.
        // card/popup은 밝은 배경 기준 톤이라 딤 배경 위에서는 거의 안 보여서 별도 정의.
        float: "0 10px 24px 0 rgba(0, 0, 0, 0.16)",
      },

      // ── 게임 튜토리얼 연출용 키프레임 ──
      // (스포트라이트 강조와 캐릭터의 가벼운 idle 연출에 사용)
      keyframes: {
        // 일반 설명 단계에서 포커스가 바뀔 때 한 번만 나타나는 강조.
        // 링(1레이어) 위에 흐린 글로우(2레이어)를 겹쳐 "테두리+은은한 발광" 느낌을 낸다.
        "tutorial-focus-in": {
          "0%": {
            boxShadow: "0 0 0 2px rgba(255, 107, 157, 0), 0 0 0 0 rgba(255, 107, 157, 0)",
            opacity: "0",
          },
          "100%": {
            boxShadow: "0 0 0 4px rgba(255, 107, 157, 0.24), 0 0 24px 6px rgba(255, 107, 157, 0.28)",
            opacity: "1",
          },
        },
        // 관찰 단계에서 가격 tick과 함께 한 번 재생되는 부드러운 pulse.
        "tutorial-observe": {
          "0%": {
            boxShadow: "0 0 0 3px rgba(255, 107, 157, 0.18), 0 0 16px 2px rgba(255, 107, 157, 0.14)",
          },
          "45%": {
            boxShadow: "0 0 0 8px rgba(255, 107, 157, 0.2), 0 0 30px 8px rgba(255, 107, 157, 0.24)",
          },
          "100%": {
            boxShadow: "0 0 0 4px rgba(255, 107, 157, 0.24), 0 0 24px 6px rgba(255, 107, 157, 0.28)",
          },
        },
        "tutorial-watch-beacon": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.55" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
        },
        // 꼬비의 아주 약한 idle 둥실거림
        "char-float": {
          "0%, 100%": {
            transform: "translateY(0) scale(var(--kkobi-scale, 1))",
          },
          "50%": {
            transform: "translateY(-4px) scale(var(--kkobi-scale, 1))",
          },
        },
      },
      animation: {
        "tutorial-focus-in": "tutorial-focus-in 0.35s ease-out both",
        "tutorial-observe": "tutorial-observe 0.7s ease-out both",
        "tutorial-watch-beacon": "tutorial-watch-beacon 1.2s ease-in-out infinite",
        "char-float": "char-float 3.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
