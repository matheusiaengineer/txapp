export interface QualifiedStatus {
  qualified: boolean;
  balance: number;
  requiredDeposit: number;
  serviceType: "moto" | "carro" | "freight";
  canRequest: boolean;
  missingAmount: number;
}

const MINIMUM_DEPOSITS: Record<string, number> = {
  moto: 15,
  carro: 25,
  freight: 30,
};

const STORAGE_KEY = "txd_qualified_clients";

function getQualifiedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveQualifiedSet(set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

export class QualifiedClientService {
  private qualifiedSet: Set<string>;

  constructor() {
    this.qualifiedSet = getQualifiedSet();
  }

  getRequiredDeposit(serviceType: string): number {
    return MINIMUM_DEPOSITS[serviceType] || MINIMUM_DEPOSITS.carro;
  }

  check(userId: string, serviceType: string): QualifiedStatus {
    const requiredDeposit = this.getRequiredDeposit(serviceType);
    const balance = this.getBalance(userId);
    const qualified = balance >= requiredDeposit;

    return {
      qualified,
      balance,
      requiredDeposit,
      serviceType: serviceType as QualifiedStatus["serviceType"],
      canRequest: qualified,
      missingAmount: qualified ? 0 : requiredDeposit - balance,
    };
  }

  getBalance(userId: string): number {
    const key = `txd_wallet_${userId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}
    return 0;
  }

  deposit(userId: string, amount: number): number {
    const currentBalance = this.getBalance(userId);
    const newBalance = currentBalance + amount;
    const key = `txd_wallet_${userId}`;
    try {
      localStorage.setItem(key, JSON.stringify(newBalance));
    } catch {}

    if (newBalance >= 25) {
      this.qualifiedSet.add(userId);
      saveQualifiedSet(this.qualifiedSet);
    }

    return newBalance;
  }

  isQualified(userId: string): boolean {
    return this.qualifiedSet.has(userId);
  }

  getQualifiedUserIds(): string[] {
    return [...this.qualifiedSet];
  }

  deductFromBalance(userId: string, amount: number): number {
    const currentBalance = this.getBalance(userId);
    const newBalance = Math.max(0, currentBalance - amount);
    const key = `txd_wallet_${userId}`;
    try {
      localStorage.setItem(key, JSON.stringify(newBalance));
    } catch {}
    return newBalance;
  }
}

export const qualifiedClientService = new QualifiedClientService();
