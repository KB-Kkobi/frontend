import {
  PRODUCT_LIST_DEFAULTS,
  PRODUCT_TYPES,
  normalizeProductType,
} from "@/constants/product";
import { get, post } from "@/api/http";
import { getAuthorizationHeader } from "@/utils/authStorage";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

const PRODUCT_API_PATHS = Object.freeze({
  [PRODUCT_TYPES.DEPOSIT]: "/api/products/deposits",
  [PRODUCT_TYPES.SAVING]: "/api/products/savings",
});

const PRODUCT_HOLDINGS_API_PATH = "/api/products/holdings";

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

async function parseResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (!text) return null;

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

function getResponseMessage(data) {
  return typeof data === "object" && data?.message
    ? data.message
    : "상품 정보를 불러오지 못했습니다.";
}

function getErrorCode(status) {
  if (status === 400 || status === 404) return PRODUCT_API_ERROR_CODES.NOT_FOUND;
  if (status === 401 || status === 403) {
    return PRODUCT_API_ERROR_CODES.UNAUTHORIZED;
  }
  return PRODUCT_API_ERROR_CODES.REQUEST_FAILED;
}

async function requestProduct(path) {
  let response;
  const authorization = getAuthorizationHeader();
  const headers = { Accept: "application/json" };
  if (authorization) headers.Authorization = authorization;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers,
    });
  } catch {
    throw new ProductApiError(
      "상품 서버에 연결할 수 없습니다.",
      0,
      PRODUCT_API_ERROR_CODES.NETWORK,
    );
  }

  const data = await parseResponse(response);
  if (!response.ok) {
    throw new ProductApiError(
      getResponseMessage(data),
      response.status,
      getErrorCode(response.status),
    );
  }

  return data;
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

export async function fetchProductHoldings() {
  const response = await get(PRODUCT_HOLDINGS_API_PATH);
  return Array.isArray(response) ? response : [];
}
