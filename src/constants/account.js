export const INVESTMENT_PERIOD_MONTHS = 12;

export const ACCOUNT_AMOUNT_LIMITS = Object.freeze({
  seedMoney: 1_000_000_000,
  monthlyInvestAmount: 10_000_000,
});

export const ACCOUNT_SETUP_DEFAULTS = Object.freeze({
  seedMoney: 10_000_000,
  monthlyInvestAmount: 300_000,
});

export const SEED_MONEY_OPTIONS = Object.freeze([
  { label: "1,000만원", value: 10_000_000 },
  { label: "3,000만원", value: 30_000_000 },
  { label: "5,000만원", value: 50_000_000 },
  { label: "1억원", value: 100_000_000 },
]);

export const MONTHLY_INVESTMENT_OPTIONS = Object.freeze([
  { label: "10만원", value: 100_000 },
  { label: "30만원", value: 300_000 },
  { label: "50만원", value: 500_000 },
  { label: "100만원", value: 1_000_000 },
]);
