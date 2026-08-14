const ALPHA_THRESHOLD = 10;
// 완전히 꽉 찬 크롭처럼 보이지 않도록, 실제 콘텐츠 기준으로 살짝 여백을 남긴다.
const CONTENT_MARGIN_RATIO = 0.08;
// 여백이 이 비율 이상 이미 채워져 있으면(=원본이 이미 타이트함) 자르지 않는다.
const ALREADY_TIGHT_RATIO = 0.97;

const trimPromiseCache = new Map();

/**
 * 은행 로고 PNG의 투명 여백을 잘라낸 데이터 URL을 반환한다(캐시됨).
 * 실제 그림(불투명 픽셀) 영역만 남기고, 그 주변 이미지는 그대로 유지한다
 * (crop한 영역 내부의 픽셀은 원본 그대로 — 확대/왜곡/재색상 없음).
 */
export function getTrimmedLogoSrc(src) {
  if (!trimPromiseCache.has(src)) {
    trimPromiseCache.set(src, loadAndTrim(src));
  }
  return trimPromiseCache.get(src);
}

function loadAndTrim(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        resolve(trim(image) ?? src);
      } catch {
        resolve(src);
      }
    };
    image.onerror = () => reject(new Error(`이미지를 불러오지 못했습니다: ${src}`));
    image.src = src;
  });
}

function trim(image) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(rowOffset + x) * 4 + 3];
      if (alpha <= ALPHA_THRESHOLD) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) return null; // 완전히 투명한 이미지

  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;

  if (
    contentWidth >= width * ALREADY_TIGHT_RATIO &&
    contentHeight >= height * ALREADY_TIGHT_RATIO
  ) {
    return null; // 이미 여백이 거의 없어 원본 그대로 사용
  }

  const marginX = Math.round(contentWidth * CONTENT_MARGIN_RATIO);
  const marginY = Math.round(contentHeight * CONTENT_MARGIN_RATIO);
  const cropX = Math.max(0, minX - marginX);
  const cropY = Math.max(0, minY - marginY);
  const cropWidth = Math.min(width, maxX + marginX + 1) - cropX;
  const cropHeight = Math.min(height, maxY + marginY + 1) - cropY;

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;
  cropCanvas
    .getContext("2d")
    .drawImage(
      canvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

  return cropCanvas.toDataURL("image/png");
}
