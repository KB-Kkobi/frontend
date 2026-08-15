/**
 * 은행 공식 로고 asset은 이 디렉터리(src/assets/banks/)에 직접 추가한다.
 * 파일이 아직 없는 은행이 있어도 빌드가 깨지지 않도록, import.meta.glob으로
 * 실제 존재하는 파일만 동적으로 불러와 매핑한다. 파일이 나중에 추가되면
 * 이 파일을 수정하지 않아도 자동으로 반영된다.
 */
const logoModules = import.meta.glob("./*.{png,jpg,jpeg,svg,webp}", {
  eager: true,
  import: "default",
});

function findLogoByFileKey(fileKey) {
  const entry = Object.entries(logoModules).find(
    ([path]) => path.replace("./", "").replace(/\.[^./]+$/, "") === fileKey,
  );
  return entry ? entry[1] : null;
}

// DB(kor_co_nm)에 저장된 은행명 -> asset 파일명(확장자 제외) 매핑.
// 예상 파일: bnk-kyongnam / kjbank / kb / nh / bnk-busan / sh / shinhan /
// imbank / woori / jbbank / jejubank / kakao / kbank / hana / ibk / toss / kdb / sc
const BANK_LOGO_FILE_KEYS = Object.freeze({
  경남은행: "bnk-kyongnam",
  광주은행: "kjbank",
  국민은행: "kb",
  농협은행주식회사: "nh",
  부산은행: "bnk-busan",
  수협은행: "sh",
  신한은행: "shinhan",
  아이엠뱅크: "imbank",
  우리은행: "woori",
  전북은행: "jbbank",
  제주은행: "jejubank",
  "주식회사 카카오뱅크": "kakao",
  "주식회사 케이뱅크": "kbank",
  "주식회사 하나은행": "hana",
  중소기업은행: "ibk",
  "토스뱅크 주식회사": "toss",
  한국산업은행: "kdb",
  한국스탠다드차타드은행: "sc",
});

// bankLogoMap[은행명] -> 로고 URL(파일이 없으면 null)
export const bankLogoMap = Object.fromEntries(
  Object.entries(BANK_LOGO_FILE_KEYS).map(([bankName, fileKey]) => [
    bankName,
    findLogoByFileKey(fileKey),
  ]),
);
