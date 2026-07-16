export interface WalletTransaction {
  id: string;
  userId: string;
  type: "deposit" | "withdrawal" | "payment" | "refund" | "cashback" | "bonus" | "tip" | "commission" | "transfer";
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  paymentMethod?: string;
  referenceId?: string;
  createdAt: string;
  completedAt?: string;
}

export class WalletService {
  private transactions: WalletTransaction[] = [];

  async getBalance(userId: string, currency: string): Promise<number> {
    const txs = this.transactions.filter(t => t.userId === userId && t.currency === currency && t.status === "completed");
    return txs.reduce((acc, t) => acc + (t.type === "withdrawal" || t.type === "payment" ? -t.amount : t.amount), 0);
  }

  async deposit(userId: string, amount: number, currency: string, method: string, referenceId?: string): Promise<WalletTransaction> {
    const balance = await this.getBalance(userId, currency);
    const tx: WalletTransaction = {
      id: "tx_" + Date.now(), userId, type: "deposit", amount, currency,
      balanceBefore: balance, balanceAfter: balance + amount,
      description: `Dep\u00f3sito via ${method}`, status: "completed",
      paymentMethod: method, referenceId, createdAt: new Date().toISOString(), completedAt: new Date().toISOString(),
    };
    this.transactions.push(tx);
    return tx;
  }

  async withdraw(userId: string, amount: number, currency: string, method: string): Promise<WalletTransaction> {
    const balance = await this.getBalance(userId, currency);
    if (balance < amount) throw new Error("Saldo insuficiente");
    const tx: WalletTransaction = {
      id: "tx_" + Date.now(), userId, type: "withdrawal", amount, currency,
      balanceBefore: balance, balanceAfter: balance - amount,
      description: `Saque via ${method}`, status: "pending",
      paymentMethod: method, createdAt: new Date().toISOString(),
    };
    this.transactions.push(tx);
    return tx;
  }

  async processPayment(userId: string, amount: number, currency: string, description: string, referenceId?: string): Promise<WalletTransaction> {
    const balance = await this.getBalance(userId, currency);
    const tx: WalletTransaction = {
      id: "tx_" + Date.now(), userId, type: "payment", amount, currency,
      balanceBefore: balance, balanceAfter: balance - amount,
      description, status: "completed", referenceId,
      createdAt: new Date().toISOString(), completedAt: new Date().toISOString(),
    };
    this.transactions.push(tx);
    return tx;
  }

  async addCashback(userId: string, amount: number, currency: string, description: string): Promise<WalletTransaction> {
    const balance = await this.getBalance(userId, currency);
    const tx: WalletTransaction = {
      id: "tx_" + Date.now(), userId, type: "cashback", amount, currency,
      balanceBefore: balance, balanceAfter: balance + amount,
      description, status: "completed",
      createdAt: new Date().toISOString(), completedAt: new Date().toISOString(),
    };
    this.transactions.push(tx);
    return tx;
  }

  async getHistory(userId: string, currency?: string, limit = 50, offset = 0): Promise<WalletTransaction[]> {
    let txs = this.transactions.filter(t => t.userId === userId);
    if (currency) txs = txs.filter(t => t.currency === currency);
    return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(offset, offset + limit);
  }

  async splitPayment(tripId: string, passengers: { userId: string; amount: number }[], currency: string): Promise<WalletTransaction[]> {
    return Promise.all(passengers.map(p => this.processPayment(p.userId, p.amount, currency, `Divis\u00e3o de corrida ${tripId}`, tripId)));
  }
}

export const walletService = new WalletService();
