// All monetary values in centavos (integers) to avoid floating point (rule 121)
export type Centavos = number;

export function reaisToCentavos(reais: number): Centavos {
  return Math.round(reais * 100);
}

export function centavosToReais(centavos: Centavos): number {
  return centavos / 100;
}

export function formatCurrency(centavos: Centavos): string {
  return `R$ ${centavosToReais(centavos).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Split wallet: deduct from promotional first (rule 128)
export function calculateDeduction(
  amount: Centavos,
  realBalance: Centavos,
  promotionalBalance: Centavos
): { fromPromotional: Centavos; fromReal: Centavos; remainingAmount: Centavos } {
  const fromPromotional = Math.min(amount, promotionalBalance);
  const remaining = amount - fromPromotional;
  const fromReal = Math.min(remaining, realBalance);
  return { fromPromotional, fromReal, remainingAmount: remaining - fromReal };
}

// Block transfers > balance or negative (rule 136)
export function validateTransfer(amount: Centavos, balance: Centavos): { valid: boolean; error?: string } {
  if (amount <= 0) return { valid: false, error: "Valor deve ser positivo" };
  if (amount > balance) return { valid: false, error: "Saldo insuficiente" };
  return { valid: true };
}

// Point conversion (rule 139)
export function convertPointsToReais(points: number, divisor: number = 100): Centavos {
  return Math.floor((points / divisor) * 100);
}

// Tip presets (rule 138)
export function calculateTip(amount: Centavos, percentage: number): Centavos {
  return Math.round(amount * percentage / 100);
}
export const TIP_PRESETS = [10, 15, 20];
