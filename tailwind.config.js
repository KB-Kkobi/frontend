/**
 * 결투 디자인 토큰 — Tailwind Config
 * -------------------------------------------------------------
 * 팀 공통 팔레트 / 타이포. 원시 hex(#FF6B9D 등)를 직접 쓰지 말고
 * 아래 시맨틱 클래스를 사용하세요.
 *   색   : bg-primary, bg-primary-soft, text-blue, text-profit, border-line ...
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
      primary: { DEFAULT: "#FF6B9D", soft: "#FEF2F6" }, // 핑크 (주색)
      blue: { DEFAULT: "#5B8BF7", soft: "#F0F5FE" },
      green: { DEFAULT: "#55C770", soft: "#EFFAF7" },
      yellow: { DEFAULT: "#FED063", soft: "#FEF7E0" },

      // ── 의미 색 (금액·수치·알림 전용) ──
      profit: "#FF6B9D", // 수익 / 상승 = 핑크
      loss: "#5B8BF7", // 손실 / 하락 = 블루
      success: "#55C770",
      error: "#E5484D", // 핑크와 확실히 구분되는 정통 빨강

      // ── 중립색 (회색 4 + 배경 1) ──
      ink: "#1F2430", // 제목·본문 텍스트
      muted: "#8B8A85", // 보조 텍스트·placeholder
      line: "#E4E3E0", // 테두리·구분선
      surface: "#F5F4F2", // 카드 배경
      base: "#FBFBFB", // 페이지 배경(단색)
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
        // 페이지 배경 그라데이션 (흰색 → 크림)
        page: "linear-gradient(180deg, #FDFAE9 0%,  #FFFFFF 100%)",
      },
    },
  },
  plugins: [],
};
