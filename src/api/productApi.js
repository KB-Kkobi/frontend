import {
  PRODUCT_LIST_DEFAULTS,
  PRODUCT_TYPES,
  normalizeProductType,
} from "@/constants/product";
import { ApiError, get, post } from "@/api/http";

const PRODUCT_API_PATHS = Object.freeze({
  [PRODUCT_TYPES.DEPOSIT]: "/api/products/deposits",
  [PRODUCT_TYPES.SAVING]: "/api/products/savings",
});

const PRODUCT_HOLDINGS_API_PATH = "/api/products/holdings";
const PRODUCT_RECOMMENDATIONS_API_PATH = "/api/products/recommendations";

export const PRODUCT_API_ERROR_CODES = Object.freeze({
  INVALID_TYPE: "INVALID_TYPE",
  INVALID_ID: "INVALID_ID",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  NETWORK: "NETWORK",
  REQUEST_FAILED: "REQUEST_FAILED",
});

export class ProductApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ProductApiError";
    this.status = status;
    this.code = code;
  }
}

function getErrorCode(status) {
  if (status === 400 || status === 404) return PRODUCT_API_ERROR_CODES.NOT_FOUND;
  if (status === 401 || status === 403) {
    return PRODUCT_API_ERROR_CODES.UNAUTHORIZED;
  }
  return PRODUCT_API_ERROR_CODES.REQUEST_FAILED;
}

async function requestProduct(path) {
  try {
    return await get(path);
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ProductApiError(
        error.message,
        error.status,
        error.status === 0
          ? PRODUCT_API_ERROR_CODES.NETWORK
          : getErrorCode(error.status),
      );
    }
    throw error;
  }
}

function getProductApiPath(productType) {
  const normalizedProductType = normalizeProductType(productType);
  const path = PRODUCT_API_PATHS[normalizedProductType];

  if (!path) {
    throw new ProductApiError(
      "지원하지 않는 상품 유형입니다.",
      400,
      PRODUCT_API_ERROR_CODES.INVALID_TYPE,
    );
  }

  return path;
}

function getProductTypeHandler(handlers, productType) {
  const normalizedProductType = normalizeProductType(productType);
  const handler = handlers[normalizedProductType];

  if (!handler) getProductApiPath(productType);
  return handler;
}

function validateProductId(productId) {
  const parsedProductId = Number(productId);
  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    throw new ProductApiError(
      "올바르지 않은 상품 ID입니다.",
      400,
      PRODUCT_API_ERROR_CODES.INVALID_ID,
    );
  }
  return parsedProductId;
}

function buildProductListQuery(params = {}) {
  const query = new URLSearchParams();
  const requestParams = { ...PRODUCT_LIST_DEFAULTS, ...params };

  Object.entries(requestParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== undefined && item !== "") {
          query.append(key, String(item));
        }
      });
      return;
    }

    if (value !== null && value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

function normalizeProductListItem(product) {
  return {
    ...product,
    financialCompanyName:
      product.financialCompanyName ?? product.financialCompnayName ?? null,
    joinWay: product.joinWay ?? product.joinway ?? null,
  };
}

function normalizeProductListResponse(response) {
  return {
    content: Array.isArray(response?.content)
      ? response.content.map(normalizeProductListItem)
      : [],
    page: response?.page ?? PRODUCT_LIST_DEFAULTS.page,
    size: response?.size ?? PRODUCT_LIST_DEFAULTS.size,
    totalElements: response?.totalElements ?? 0,
    totalPages: response?.totalPages ?? 0,
  };
}

async function requestProductList(productType, params) {
  const path = getProductApiPath(productType);
  const response = await requestProduct(
    `${path}?${buildProductListQuery(params)}`,
  );
  return normalizeProductListResponse(response);
}

export function fetchDepositProductList(params) {
  return requestProductList(PRODUCT_TYPES.DEPOSIT, params);
}

export function fetchSavingProductList(params) {
  return requestProductList(PRODUCT_TYPES.SAVING, params);
}

// 홈 화면 추천용 예·적금 1건 조회 (예금·적금 최고금리 1위 중 더 높은 쪽, 서버에서 선택)
export async function fetchRecommendedSavingsProduct() {
  const response = await requestProduct(PRODUCT_RECOMMENDATIONS_API_PATH);
  return response ? normalizeProductListItem(response) : null;
}

const PRODUCT_LIST_FETCHERS = Object.freeze({
  [PRODUCT_TYPES.DEPOSIT]: fetchDepositProductList,
  [PRODUCT_TYPES.SAVING]: fetchSavingProductList,
});

export function fetchProductList(productType, params) {
  const fetchList = getProductTypeHandler(
    PRODUCT_LIST_FETCHERS,
    productType,
  );
  return fetchList(params);
}

export function fetchDepositProductDetail(productId) {
  return requestProduct(
    `${PRODUCT_API_PATHS[PRODUCT_TYPES.DEPOSIT]}/${validateProductId(productId)}`,
  );
}

export function fetchSavingProductDetail(productId) {
  return requestProduct(
    `${PRODUCT_API_PATHS[PRODUCT_TYPES.SAVING]}/${validateProductId(productId)}`,
  );
}

const PRODUCT_DETAIL_FETCHERS = Object.freeze({
  [PRODUCT_TYPES.DEPOSIT]: fetchDepositProductDetail,
  [PRODUCT_TYPES.SAVING]: fetchSavingProductDetail,
});

export function fetchProductDetail(productType, productId) {
  const fetchDetail = getProductTypeHandler(
    PRODUCT_DETAIL_FETCHERS,
    productType,
  );
  return fetchDetail(productId);
}

export function subscribeProduct(request) {
  return post(PRODUCT_HOLDINGS_API_PATH, request);
}

export function estimateProductSubscription(request) {
  return post(`${PRODUCT_HOLDINGS_API_PATH}/subscription-estimate`, request);
}

export async function fetchProductHoldings() {
  const response = await get(PRODUCT_HOLDINGS_API_PATH);
  return Array.isArray(response) ? response : [];
}

export async function fetchProductHolding(holdingProductId) {
  const parsedHoldingProductId = Number(holdingProductId);
  if (!Number.isInteger(parsedHoldingProductId) || parsedHoldingProductId <= 0) {
    return null;
  }

  return get(`${PRODUCT_HOLDINGS_API_PATH}/${parsedHoldingProductId}`);
}

export async function fetchProductHoldingHistory() {
  const response = await get(`${PRODUCT_HOLDINGS_API_PATH}/history`);
  return Array.isArray(response) ? response : [];
}

export function fetchProductTerminationEstimate(holdingProductId) {
  const parsedHoldingProductId = validateProductId(holdingProductId);
  return get(
    `${PRODUCT_HOLDINGS_API_PATH}/${parsedHoldingProductId}/termination-estimate`,
  );
}

export function terminateProduct(holdingProductId) {
  const parsedHoldingProductId = validateProductId(holdingProductId);
  return post(
    `${PRODUCT_HOLDINGS_API_PATH}/${parsedHoldingProductId}/terminate`,
  );
}
