export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const AGREEMENT_ITEMS = [
  { id: "age", label: "[필수] 만 14세 이상입니다", required: true },
  { id: "terms", label: "[필수] 서비스 이용약관 동의", required: true },
  { id: "privacy", label: "[필수] 개인정보 수집 및 이용 동의", required: true },
  { id: "marketing", label: "[선택] 마케팅 정보 수신 동의", required: false },
];
