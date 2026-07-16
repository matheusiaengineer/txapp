export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  formatLocale: string;
  isCrypto: boolean;
  minWithdrawal: number;
  maxWithdrawal: number;
  withdrawalFee: number;
}

export const CURRENCIES: Currency[] = [
  { code: "BRL", name: "Brazilian Real", symbol: "R$", decimals: 2, formatLocale: "pt-BR", isCrypto: false, minWithdrawal: 10, maxWithdrawal: 50000, withdrawalFee: 0.99 },
  { code: "USD", name: "US Dollar", symbol: "$", decimals: 2, formatLocale: "en-US", isCrypto: false, minWithdrawal: 5, maxWithdrawal: 10000, withdrawalFee: 0.50 },
  { code: "EUR", name: "Euro", symbol: "\u20ac", decimals: 2, formatLocale: "de-DE", isCrypto: false, minWithdrawal: 5, maxWithdrawal: 10000, withdrawalFee: 0.50 },
  { code: "GBP", name: "British Pound", symbol: "\u00a3", decimals: 2, formatLocale: "en-GB", isCrypto: false, minWithdrawal: 5, maxWithdrawal: 8000, withdrawalFee: 0.50 },
  { code: "JPY", name: "Japanese Yen", symbol: "\u00a5", decimals: 0, formatLocale: "ja-JP", isCrypto: false, minWithdrawal: 500, maxWithdrawal: 1000000, withdrawalFee: 100 },
  { code: "CNY", name: "Chinese Yuan", symbol: "\u00a5", decimals: 2, formatLocale: "zh-CN", isCrypto: false, minWithdrawal: 30, maxWithdrawal: 70000, withdrawalFee: 3 },
  { code: "ARS", name: "Argentine Peso", symbol: "$", decimals: 2, formatLocale: "es-AR", isCrypto: false, minWithdrawal: 500, maxWithdrawal: 500000, withdrawalFee: 50 },
  { code: "MXN", name: "Mexican Peso", symbol: "$", decimals: 2, formatLocale: "es-MX", isCrypto: false, minWithdrawal: 50, maxWithdrawal: 100000, withdrawalFee: 5 },
  { code: "COP", name: "Colombian Peso", symbol: "$", decimals: 2, formatLocale: "es-CO", isCrypto: false, minWithdrawal: 10000, maxWithdrawal: 20000000, withdrawalFee: 1000 },
  { code: "CLP", name: "Chilean Peso", symbol: "$", decimals: 0, formatLocale: "es-CL", isCrypto: false, minWithdrawal: 1000, maxWithdrawal: 5000000, withdrawalFee: 500 },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/", decimals: 2, formatLocale: "es-PE", isCrypto: false, minWithdrawal: 10, maxWithdrawal: 20000, withdrawalFee: 1 },
  { code: "INR", name: "Indian Rupee", symbol: "\u20b9", decimals: 2, formatLocale: "hi-IN", isCrypto: false, minWithdrawal: 100, maxWithdrawal: 500000, withdrawalFee: 10 },
  { code: "NGN", name: "Nigerian Naira", symbol: "\u20a6", decimals: 2, formatLocale: "en-NG", isCrypto: false, minWithdrawal: 500, maxWithdrawal: 5000000, withdrawalFee: 50 },
  { code: "ZAR", name: "South African Rand", symbol: "R", decimals: 2, formatLocale: "en-ZA", isCrypto: false, minWithdrawal: 20, maxWithdrawal: 100000, withdrawalFee: 2 },
  { code: "BTC", name: "Bitcoin", symbol: "\u20bf", decimals: 8, formatLocale: "en-US", isCrypto: true, minWithdrawal: 0.0001, maxWithdrawal: 10, withdrawalFee: 0.0005 },
  { code: "ETH", name: "Ethereum", symbol: "\u039e", decimals: 6, formatLocale: "en-US", isCrypto: true, minWithdrawal: 0.001, maxWithdrawal: 100, withdrawalFee: 0.005 },
  { code: "USDT", name: "Tether", symbol: "\u20ae", decimals: 2, formatLocale: "en-US", isCrypto: true, minWithdrawal: 1, maxWithdrawal: 50000, withdrawalFee: 0.50 },
  { code: "USDC", name: "USD Coin", symbol: "\u20ae", decimals: 2, formatLocale: "en-US", isCrypto: true, minWithdrawal: 1, maxWithdrawal: 50000, withdrawalFee: 0.50 },
  { code: "SOL", name: "Solana", symbol: "\u25ce", decimals: 4, formatLocale: "en-US", isCrypto: true, minWithdrawal: 0.01, maxWithdrawal: 1000, withdrawalFee: 0.001 },
];

export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code);
}

export function formatCurrencyValue(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  if (!currency) return `${amount}`;
  try {
    return new Intl.NumberFormat(currency.formatLocale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    }).format(amount);
  } catch {
    return `${currency.symbol} ${amount.toFixed(currency.decimals)}`;
  }
}

export function convertCurrency(amount: number, from: string, to: string, rates: Record<string, number>): number {
  if (from === to) return amount;
  const rate = rates[`${from}_${to}`];
  if (!rate) return amount;
  return amount * rate;
}
