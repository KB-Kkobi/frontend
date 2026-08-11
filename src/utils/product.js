import { PRODUCT_TYPES, normalizeProductType } from "@/constants/product";

const DAYS_PER_YEAR = 365;
const RATE_DIVISOR = 100;

function addMonthsClamped(date, months) {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(originalDay, lastDay));
  return result;
}

function getInstallmentDate(startDate, installmentIndex, paymentDay) {
  if (installmentIndex === 0) return new Date(startDate);

  const result = addMonthsClamped(startDate, installmentIndex);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(Number(paymentDay) || startDate.getDate(), lastDay));
  return result;
}

function getDaysBetween(startDate, endDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.max(
    0,
    Math.round((endDate.getTime() - startDate.getTime()) / millisecondsPerDay),
  );
}

function calculateSimpleInterest(principal, annualRate, interestDays) {
  if (!principal || !annualRate || interestDays <= 0) return 0;
  return Math.floor(
    (principal * annualRate * interestDays) /
      RATE_DIVISOR /
      DAYS_PER_YEAR,
  );
}

export function calculateExpectedProductAmounts({
  productType,
  joinAmount,
  appliedRate,
  savingTerm,
  paymentDay,
  startDate = new Date(),
}) {
  const amount = Number(joinAmount);
  const rate = Number(appliedRate);
  const term = Number(savingTerm);

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isFinite(rate) ||
    !Number.isInteger(term) ||
    term <= 0
  ) {
    return { expectedPrincipal: 0, expectedInterest: 0, expectedAmount: 0 };
  }

  const maturityDate = addMonthsClamped(startDate, term);
  const normalizedProductType = normalizeProductType(productType);

  if (normalizedProductType === PRODUCT_TYPES.DEPOSIT) {
    const expectedInterest = calculateSimpleInterest(
      amount,
      rate,
      getDaysBetween(startDate, maturityDate),
    );
    return {
      expectedPrincipal: amount,
      expectedInterest,
      expectedAmount: amount + expectedInterest,
    };
  }

  let expectedInterest = 0;
  for (let installmentIndex = 0; installmentIndex < term; installmentIndex += 1) {
    const installmentDate = getInstallmentDate(
      startDate,
      installmentIndex,
      paymentDay,
    );
    expectedInterest += calculateSimpleInterest(
      amount,
      rate,
      getDaysBetween(installmentDate, maturityDate),
    );
  }

  const expectedPrincipal = amount * term;
  return {
    expectedPrincipal,
    expectedInterest,
    expectedAmount: expectedPrincipal + expectedInterest,
  };
}
