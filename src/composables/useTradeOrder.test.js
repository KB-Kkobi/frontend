import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/composables/usePriceFeed", () => ({
  usePriceFeed: () => ({
    currentPrice: ref(1000),
    changeRate: ref(0),
    isFailed: ref(false),
  }),
}));

vi.mock("@/api/trade", () => ({
  fetchOrderable: vi.fn(),
  createOrder: vi.fn(),
}));

import { createOrder, fetchOrderable } from "@/api/trade";
import { useTradeOrder } from "@/composables/useTradeOrder";
import { ORDER_STATUS, ORDER_TYPE } from "@/constants/trade";

beforeEach(() => {
  vi.clearAllMocks();
  fetchOrderable.mockResolvedValue({
    orderableCash: 100000,
    sellableQuantity: 10,
    maxBuyQuantityAtMarket: 100,
  });
});

describe("useTradeOrder submitOrder", () => {
  it.each([
    ["buy", ORDER_TYPE.BUY],
    ["sell", ORDER_TYPE.SELL],
  ])("%s 주문을 연속 호출해도 한 번만 제출한다", async (side, orderType) => {
    let resolveOrder;
    createOrder.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOrder = resolve;
        }),
    );

    const tradeOrder = useTradeOrder({ securityId: 1, ticker: "000001" });
    tradeOrder.side.value = side;
    tradeOrder.limitPrice.value = 1000;
    tradeOrder.quantity.value = 1;

    const firstSubmission = tradeOrder.submitOrder();
    const duplicateSubmission = tradeOrder.submitOrder();

    await expect(duplicateSubmission).resolves.toBeNull();
    await Promise.resolve();

    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ orderType }),
    );

    resolveOrder({ status: ORDER_STATUS.FILLED });
    await expect(firstSubmission).resolves.toEqual(
      expect.objectContaining({ status: ORDER_STATUS.FILLED, side }),
    );
  });
});
