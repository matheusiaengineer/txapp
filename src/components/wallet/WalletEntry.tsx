"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useUser } from "@/lib/hooks/use-user";
import { useWalletStore, type WalletTransaction, type UserRole, type WalletTxType } from "@/lib/store/wallet-store";
import { formatCurrency, centavosToReais } from "@/lib/utils/financial";
import { useToast } from "@/components/ui/toast";
import { DepositModal } from "@/components/wallet/deposit-modal";
import { WithdrawSheet } from "@/components/wallet/withdraw-sheet";
import Link from "next/link";

type TabType = "extrato" | "saques" | "cupons";

const TXT_STATUS: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", failed: "Falhou",
  reversed: "Estornado", blocked: "Bloqueado", released: "Disponivel",
  disputed: "Em disputa", withdrawal_pending: "Saque pendente",
  withdrawal_confirmed: "Saque realizado", withdrawal_failed: "Saque falhou",
};

const TXT_TYPE: Partial<Record<WalletTxType, string>> = {
  deposit: "Deposito via PIX", withdrawal: "Saque",
  ride_payment: "Pagamento de Corrida", ride_earning: "Ganho de Corrida",
  freight_payment: "Pagamento de Frete", freight_earning: "Ganho de Frete",
  refund: "Reembolso", platform_fee: "Taxa da Plataforma",
  bonus: "Bonus", cashback: "Cashback",
  commission: "Comissao", transfer: "Transferencia TXD",
  escrow_block: "Bloqueio de Seguranca", escrow_release: "Liberacao de Seguranca",
  monthly_fee: "Mensalidade", advancement: "Adiantamento",
  fine: "Multa", tip: "Gorjeta",
  boleto: "Deposito via Boleto",
  credit_usage: "Uso de Credito", invoice_payment: "Pagamento de Fatura",
};

const TYPE_ICON: Partial<Record<WalletTxType, string>> = {
  deposit: "↓", withdrawal: "↑", ride_payment: "↑",
  ride_earning: "↓", freight_payment: "↑", freight_earning: "↓",
  refund: "↓", platform_fee: "↑", bonus: "↓",
  cashback: "↓", tip: "↓",
};

function isCredit(type: WalletTxType): boolean {
  return ["deposit", "ride_earning", "freight_earning", "refund", "bonus", "cashback", "tip", "escrow_release", "advancement", "invoice_payment"].includes(type);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const opts: Intl.DateTimeFormatOptions = isToday
    ? { hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short" };
  const label = isToday ? "Hoje" : "";
  return label ? `${label}, ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : d.toLocaleDateString("pt-BR", opts);
}

function TransactionRow({ tx, onClick }: { tx: WalletTransaction; onClick: () => void }) {
  const credit = isCredit(tx.type);
  const statusPending = (tx.status as string) === "pending" || tx.status === "blocked" || tx.status === "disputed";
  const statusColor = tx.status === "disputed" ? "text-yellow-400" : credit ? "text-green-400" : "text-red-400";
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl transition hover:bg-white/[0.02] text-left min-h-[60px]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className={"w-10 h-10 rounded-xl flex items-center justify-center shrink-0 " + (credit ? "bg-green-400/15" : statusPending ? "bg-yellow-400/15" : "bg-red-400/15")}>
        <span className={"text-sm font-bold " + (credit ? "text-green-400" : statusPending ? "text-yellow-400" : "text-red-400")}>{TYPE_ICON[tx.type] || (credit ? "↓" : "↑")}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{tx.description || TXT_TYPE[tx.type] || tx.type}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">{formatDate(tx.createdAt)}</span>
          {statusPending && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(234,179,8,0.15)", color: "#EAB308" }}>{TXT_STATUS[tx.status] || tx.status}</span>}
          {tx.status === "disputed" && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(234,179,8,0.15)", color: "#EAB308" }}>⚖ Disputa</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={"text-sm font-bold " + statusColor}>{credit ? "+" : "-"}{formatCurrency(tx.amount)}</p>
        {statusPending && <p className="text-[10px] text-gray-600">Pendente</p>}
      </div>
    </button>
  );
}

export default function WalletEntry() {
  const { user, loading: userLoading } = useUser();
  const store = useWalletStore();
  const toast = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("extrato");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txPage, setTxPage] = useState(0);
  const [hasMoreTx, setHasMoreTx] = useState(true);
  const [filterType, setFilterType] = useState<WalletTxType | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [savedPixKeys, setSavedPixKeys] = useState<string[]>([]);
  const [pixKey, setPixKey] = useState("");
  const [profileName, setProfileName] = useState("");
  const [kycStatus, setKycStatus] = useState("pending");
  const [role, setRole] = useState<UserRole>("passenger");
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WalletTransaction[]>([]);

  const privacyKey = "txd_privacy_mode";

  useEffect(() => {
    try { const saved = localStorage.getItem(privacyKey); if (saved === "true") setPrivacyMode(true); } catch { /* */ }
  }, []);

  const togglePrivacy = useCallback(() => {
    setPrivacyMode(p => { const next = !p; try { localStorage.setItem(privacyKey, String(next)); } catch { /* */ } return next; });
  }, []);

  useEffect(() => {
    if (userLoading || !user) return;
    (async () => {
      setLoading(true);
      try {
        const { data: profile } = await supabase.from("profiles").select("role, kyc_status, full_name").eq("id", user.id).single();
        const userRole = (profile?.role || "passenger") as UserRole;
        setRole(userRole);
        setKycStatus(profile?.kyc_status || "pending");
        setProfileName(profile?.full_name || user.email?.split("@")[0] || "Usuario");

        await store.initializeWallet(user.id);
        store.setRole(userRole);

        const { data: pmData } = await supabase.from("payment_methods").select("*").eq("profile_id", user.id).eq("method_type", "pix");
        if (pmData && pmData.length > 0) {
          setSavedPixKeys(pmData.map(p => p.masked_number || p.card_last4 || ""));
        }
        const { data: profilePm } = await supabase.from("profiles").select("email, phone").eq("id", user.id).single();
        setPixKey(profilePm?.email || profilePm?.phone || "chave@txd.app");

        setTransactions(store.transactions);

        const { data: txData } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("wallet_id", store.walletId || "")
          .order("created_at", { ascending: false })
          .limit(50);

        if (txData) {
          const mapped: WalletTransaction[] = txData.map((tx: any) => ({
            id: tx.id, walletId: tx.wallet_id, type: tx.type,
            amount: Math.round(parseFloat(tx.amount) * 100),
            balanceBefore: Math.round(parseFloat(tx.balance_before) * 100),
            balanceAfter: Math.round(parseFloat(tx.balance_after) * 100),
            description: tx.description, referenceType: tx.reference_type,
            referenceId: tx.reference_id, status: tx.status || "confirmed",
            metadata: tx.metadata || null, createdAt: tx.created_at,
          }));
          setTransactions(mapped);

          const today = new Date(); today.setHours(0, 0, 0, 0);
          const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
          const todayTxs = mapped.filter(t => new Date(t.createdAt) >= today && isCredit(t.type) && t.status === "confirmed");
          const weekTxs = mapped.filter(t => new Date(t.createdAt) >= weekStart && isCredit(t.type) && t.status === "confirmed");
          const earningTypes: WalletTxType[] = ["ride_earning", "freight_earning", "tip", "cashback", "bonus"];
          const allEarnings = mapped.filter(t => t.status === "confirmed" && earningTypes.includes(t.type));
          setTodayEarnings(todayTxs.reduce((s, t) => s + t.amount, 0));
          setWeekEarnings(weekTxs.reduce((s, t) => s + t.amount, 0));
          setTotalEarnings(allEarnings.reduce((s, t) => s + t.amount, 0));

          const withdrawals = mapped.filter(t => t.type === "withdrawal" || t.type === "withdrawal_pending" || t.type === "withdrawal_confirmed" || t.type === "withdrawal_failed");
          setWithdrawalHistory(withdrawals.slice(0, 10));
          setHasMoreTx(mapped.length >= 50);
        }
      } catch { /* */ }
      setLoading(false);
    })();
  }, [user, userLoading]);

  const loadMore = useCallback(async () => {
    if (!hasMoreTx || !store.walletId) return;
    const nextPage = txPage + 1;
    const { data } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", store.walletId)
      .order("created_at", { ascending: false })
      .range(nextPage * 50, (nextPage + 1) * 50 - 1);
    if (data && data.length > 0) {
      const mapped: WalletTransaction[] = data.map((tx: any) => ({
        id: tx.id, walletId: tx.wallet_id, type: tx.type,
        amount: Math.round(parseFloat(tx.amount) * 100),
        balanceBefore: Math.round(parseFloat(tx.balance_before) * 100),
        balanceAfter: Math.round(parseFloat(tx.balance_after) * 100),
        description: tx.description, referenceType: tx.reference_type,
        referenceId: tx.reference_id, status: tx.status || "confirmed",
        metadata: tx.metadata || null, createdAt: tx.created_at,
      }));
      setTransactions(prev => [...prev, ...mapped]);
      setTxPage(nextPage);
      setHasMoreTx(data.length >= 50);
    } else {
      setHasMoreTx(false);
    }
  }, [hasMoreTx, txPage, store.walletId, supabase]);

  const filteredTransactions = useMemo(() => {
    if (filterType === "all") return transactions;
    return transactions.filter(t => t.type === filterType);
  }, [transactions, filterType]);

  const displayBalance = store.realBalance + store.promotionalBalance;
  const isDriver = role === "motoboy" || role === "taxi" || role === "freight_driver";
  const isCompany = role === "company";
  const kycBlocked = kycStatus !== "approved" && isDriver;

  const handleDepositSuccess = useCallback(() => {
    if (user) store.initializeWallet(user.id);
  }, [user, store]);

  const handleWithdrawSuccess = useCallback(() => {
    if (user) store.initializeWallet(user.id);
  }, [user, store]);

  const handleApplyCoupon = useCallback(async (code: string): Promise<boolean> => {
    if (!code.trim()) return false;
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });
      if (res.ok) { toast.show("Cupom aplicado com sucesso!", "success"); return true; }
      const err = await res.json();
      toast.show(err.error || "Cupom invalido", "error");
      return false;
    } catch { toast.show("Erro ao validar cupom", "error"); return false; }
  }, [toast]);

  if (userLoading) return <LoadingSkeleton />;
  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen" style={{ background: "#0A0D14", paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <Header role={role} profileName={profileName} kycStatus={kycStatus} privacyMode={privacyMode} onTogglePrivacy={togglePrivacy} onBack={() => window.history.back()} />

        <BalanceCard
          role={role}
          availableBalance={displayBalance}
          blockedBalance={store.blockedBalance}
          escrowBalance={store.escrowBalance}
          promotionalBalance={store.promotionalBalance}
          privacyMode={privacyMode}
          todayEarnings={todayEarnings}
          weekEarnings={weekEarnings}
          totalEarnings={totalEarnings}
          kycBlocked={kycBlocked}
          onDeposit={() => setShowDeposit(true)}
          onWithdraw={() => setShowWithdraw(true)}
        />

        {isDriver && (
          <EarningsCards todayEarnings={todayEarnings} weekEarnings={weekEarnings} totalEarnings={totalEarnings} />
        )}

        {isCompany && (
          <CompanySummary />
        )}

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
          {(["extrato", "saques", "cupons"] as TabType[]).filter(t => !(t === "cupons" && isDriver)).map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={"flex-1 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] " + (activeTab === tab ? "text-black" : "text-gray-400")} style={{ background: activeTab === tab ? "#3ECB8E" : "transparent" }}>
              {tab === "extrato" ? "Extrato" : tab === "saques" ? (isDriver ? "Saques" : "Transferencias") : "Cupons"}
            </button>
          ))}
        </div>

        {activeTab === "extrato" && (
          <TransactionSection
            transactions={filteredTransactions}
            filterType={filterType}
            filterOpen={filterOpen}
            onFilterOpen={() => setFilterOpen(!filterOpen)}
            onFilterChange={setFilterType}
            onSelectTx={setSelectedTx}
            onLoadMore={loadMore}
            hasMore={hasMoreTx}
          />
        )}

        {activeTab === "saques" && (
          <WithdrawalSection
            role={role}
            withdrawals={withdrawalHistory}
            onWithdraw={() => setShowWithdraw(true)}
          />
        )}

        {activeTab === "cupons" && !isDriver && (
          <CouponSection onApply={handleApplyCoupon} />
        )}

        {!isDriver && (
          <PixKeySection pixKey={pixKey} onCopy={() => {
            navigator.clipboard?.writeText(pixKey);
            toast.show("Chave PIX copiada!", "success");
          }} />
        )}

        <Footer />
      </div>

      <DepositModal open={showDeposit} onClose={() => setShowDeposit(false)} onSuccess={handleDepositSuccess} />
      <WithdrawSheet open={showWithdraw} onClose={() => setShowWithdraw(false)} onSuccess={handleWithdrawSuccess} availableBalance={displayBalance - store.blockedBalance} role={role} pixKey={pixKey} savedPixKeys={savedPixKeys} onSavePixKey={(key) => setSavedPixKeys(prev => [...prev, key])} />

      <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: "#0A0D14" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="h-6 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease-in-out infinite", width: "40%" }} />
        <div className="p-6 rounded-2xl space-y-3" style={{ background: "#11151c" }}>
          <div className="h-4 rounded" style={{ background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease-in-out infinite", width: "30%" }} />
          <div className="h-10 rounded" style={{ background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease-in-out infinite", width: "60%" }} />
          <div className="h-4 rounded" style={{ background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease-in-out infinite", width: "45%" }} />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="w-10 h-10 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div className="flex-1 space-y-1">
              <div className="h-3 rounded" style={{ background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease-in-out infinite", width: "50%" }} />
              <div className="h-2 rounded" style={{ background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease-in-out infinite", width: "30%" }} />
            </div>
            <div className="h-4 rounded" style={{ background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease-in-out infinite", width: "20%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({ role, profileName, kycStatus, privacyMode, onTogglePrivacy, onBack }: any) {
  const roleLabels: Record<string, string> = { passenger: "Passageiro", motoboy: "Motoboy", taxi: "Taxista", freight_driver: "Caminhoneiro", company: "Empresa" };
  const kycColor = kycStatus === "approved" ? "#3ECB8E" : kycStatus === "pending" ? "#EAB308" : "#EF4444";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }} aria-label="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">Carteira {roleLabels[role] || ""}</h1>
          <p className="text-xs text-gray-500">Carteira de {profileName}</p>
        </div>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: kycColor }} title={kycStatus === "approved" ? "Conta Verificada" : "Verificacao pendente"} />
      </div>
      <button type="button" onClick={onTogglePrivacy} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }} aria-label="Alternar privacidade">
        {privacyMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        )}
      </button>
    </div>
  );
}

function BalanceCard({ role, availableBalance, blockedBalance, escrowBalance, promotionalBalance, privacyMode, todayEarnings, weekEarnings, totalEarnings, kycBlocked, onDeposit, onWithdraw }: any) {
  const isDriver = role === "motoboy" || role === "taxi" || role === "freight_driver";
  const isCompany = role === "company";
  const show = (v: number) => privacyMode ? "*****" : formatCurrency(v);

  return (
    <div className="p-6 rounded-2xl relative overflow-hidden" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full" style={{ background: "rgba(62,203,142,0.04)", transform: "translate(30%, -30%)" }} />
      <div className="relative z-10">
        <p className="text-xs text-gray-500 mb-1">
          {isDriver ? "Saldo Disponivel para Saque" : isCompany ? "Saldo Corporativo" : "Saldo TXD Wallet"}
        </p>
        <p className="text-4xl sm:text-5xl font-bold text-white mb-2" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
          {show(availableBalance)}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="text-green-400">{show(availableBalance)} {isDriver ? "Disponivel" : "Disponivel"}</span>
          {blockedBalance > 0 && <><span className="w-1 h-1 rounded-full bg-gray-600" /><span className="text-red-400">{show(blockedBalance)} Bloqueado</span></>}
          {escrowBalance > 0 && <><span className="w-1 h-1 rounded-full bg-gray-600" /><span className="text-yellow-400">{show(escrowBalance)} Escrow</span></>}
          {promotionalBalance > 0 && <><span className="w-1 h-1 rounded-full bg-gray-600" /><span className="text-yellow-400">{show(promotionalBalance)} Bonus</span></>}
        </div>
        <div className="flex gap-3">
          {!isDriver && (
            <button type="button" onClick={onDeposit} className="flex items-center gap-2 font-bold py-3 px-5 rounded-xl text-sm min-h-[44px]" style={{ background: "#3ECB8E", color: "#000" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              {isCompany ? "Adicionar Fundos" : "Adicionar Saldo"}
            </button>
          )}
          {isDriver && (
            <button type="button" onClick={onWithdraw} disabled={kycBlocked || availableBalance < (role === "freight_driver" ? 10000 : 5000)} className="flex items-center gap-2 font-bold py-3 px-5 rounded-xl text-sm min-h-[44px] disabled:opacity-40" style={{ background: !kycBlocked && availableBalance >= (role === "freight_driver" ? 10000 : 5000) ? "#3ECB8E" : "rgba(62,203,142,0.3)", color: "#000" }} title={kycBlocked ? "Verifique sua identidade para sacar" : ""}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Solicitar Saque
            </button>
          )}
          {isCompany && (
            <button type="button" onClick={onWithdraw} className="flex items-center gap-2 font-bold py-3 px-5 rounded-xl text-sm min-h-[44px]" style={{ background: "rgba(99,102,241,0.15)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.3)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Transferir
            </button>
          )}
        </div>
        {kycBlocked && <p className="text-xs text-yellow-400 mt-2">Verifique sua identidade para sacar seus ganhos.</p>}
      </div>
    </div>
  );
}

function EarningsCards({ todayEarnings, weekEarnings, totalEarnings }: { todayEarnings: number; weekEarnings: number; totalEarnings: number }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Ganhos de Hoje", value: todayEarnings, color: "#3ECB8E" },
        { label: "Ganhos da Semana", value: weekEarnings, color: "#6366F1" },
        { label: "Total Acumulado", value: totalEarnings, color: "#FFD700" },
      ].map(item => (
        <div key={item.label} className="p-4 rounded-2xl" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{item.label}</p>
          <p className="text-lg font-bold mt-1" style={{ color: item.color }}>{formatCurrency(item.value)}</p>
        </div>
      ))}
    </div>
  );
}

function CompanySummary() {
  return (
    <div className="p-4 rounded-2xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
      <div className="flex items-center gap-2 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#6366F1" }}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="10" y2="6"/><line x1="14" y1="6" x2="16" y2="6"/></svg>
        <span className="text-sm font-bold text-white">Resumo Corporativo</span>
      </div>
      <p className="text-xs text-gray-400">Acesse o relatorio completo de gastos, centro de custo e faturas na pagina Financeiro.</p>
      <Link href="/dashboard/company/finance" className="inline-flex items-center gap-1 text-xs font-medium mt-2" style={{ color: "#6366F1" }}>
        Ver financeiro
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </Link>
    </div>
  );
}

function TransactionSection({ transactions, filterType, filterOpen, onFilterOpen, onFilterChange, onSelectTx, onLoadMore, hasMore }: any) {
  const filterOptions: Array<{ value: WalletTxType | "all"; label: string }> = [
    { value: "all", label: "Todas" },
    { value: "deposit", label: "Depositos" },
    { value: "ride_payment", label: "Corridas" },
    { value: "ride_earning", label: "Ganhos" },
    { value: "refund", label: "Reembolsos" },
    { value: "withdrawal", label: "Saques" },
    { value: "bonus", label: "Bonus" },
    { value: "platform_fee", label: "Taxas" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white">Extrato</h2>
        <button type="button" onClick={onFilterOpen} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition min-h-[36px] px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: filterOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/></svg>
          Filtrar
        </button>
      </div>
      {filterOpen && (
        <div className="flex flex-wrap gap-1.5 mb-3 p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
          {filterOptions.map(opt => (
            <button key={opt.value} type="button" onClick={() => onFilterChange(opt.value)} className={"px-3 py-1.5 rounded-lg text-xs font-medium transition " + (filterType === opt.value ? "text-black" : "text-gray-400")} style={{ background: filterType === opt.value ? "#3ECB8E" : "transparent" }}>{opt.label}</button>
          ))}
          {filterType !== "all" && (
            <button type="button" onClick={() => onFilterChange("all")} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#EF4444" }}>Limpar</button>
          )}
        </div>
      )}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)" }}>
        {transactions.length === 0 ? (
          <div className="py-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 mx-auto mb-2"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            <p className="text-sm text-gray-600">Nenhuma transacao encontrada</p>
          </div>
        ) : (
          transactions.slice(0, 50).map((tx: WalletTransaction) => (
            <TransactionRow key={tx.id} tx={tx} onClick={() => onSelectTx(tx)} />
          ))
        )}
        {hasMore && (
          <button type="button" onClick={onLoadMore} className="w-full py-3 text-center text-xs font-medium text-gray-500 hover:text-white transition min-h-[44px]">
            Carregar mais
          </button>
        )}
      </div>
    </div>
  );
}

function WithdrawalSection({ role, withdrawals, onWithdraw }: { role: string; withdrawals: WalletTransaction[]; onWithdraw: () => void }) {
  const isDriver = role === "motoboy" || role === "taxi" || role === "freight_driver";
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white">{isDriver ? "Historico de Saques" : "Transferencias"}</h2>
        <button type="button" onClick={onWithdraw} className="flex items-center gap-1 text-xs font-medium text-primary px-3 py-1.5 rounded-lg min-h-[36px]" style={{ background: "rgba(62,203,142,0.1)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          {isDriver ? "Novo Saque" : "Nova Transferencia"}
        </button>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)" }}>
        {withdrawals.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-600">Nenhum saque realizado</p>
          </div>
        ) : withdrawals.map((tx: any) => (
          <div key={tx.id} className="flex items-center gap-3 p-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{tx.description || "Saque"}</p>
              <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
            </div>
            <span className={"text-xs font-bold px-2 py-1 rounded-full " + (tx.status === "withdrawal_confirmed" || tx.status === "confirmed" ? "text-green-400 bg-green-400/10" : tx.status === "withdrawal_failed" || tx.status === "failed" ? "text-red-400 bg-red-400/10" : "text-yellow-400 bg-yellow-400/10")}>
              {TXT_STATUS[tx.status] || tx.status}
            </span>
            <p className="text-sm font-bold text-white">{formatCurrency(tx.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CouponSection({ onApply }: { onApply: (code: string) => Promise<boolean> }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const handleApply = useCallback(async () => {
    setLoading(true); await onApply(code); setLoading(false); setCode("");
  }, [code, onApply]);
  return (
    <div className="p-5 rounded-2xl" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-bold text-white mb-3">Cupom de Desconto</h3>
      <div className="flex gap-2">
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Insira o codigo" className="flex-1 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none uppercase" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} aria-label="Codigo do cupom" />
        <button type="button" onClick={handleApply} disabled={loading || !code.trim()} className="font-bold px-4 py-2.5 rounded-xl text-sm min-h-[44px]" style={{ background: loading || !code.trim() ? "rgba(62,203,142,0.3)" : "#3ECB8E", color: "#000" }}>
          {loading ? "..." : "Aplicar"}
        </button>
      </div>
    </div>
  );
}

function PixKeySection({ pixKey, onCopy }: { pixKey: string; onCopy: () => void }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-bold text-white mb-3">Sua chave PIX</h3>
      <button type="button" onClick={onCopy} className="w-full flex items-center justify-between p-3 rounded-xl text-left" style={{ background: "rgba(255,255,255,0.05)" }}>
        <span className="text-sm font-mono text-gray-300">{pixKey}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 shrink-0"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
    </div>
  );
}

function Footer() {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-2 pb-4">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      <p className="text-[10px] text-gray-600">Transacoes protegidas por SSL 256-bit</p>
    </div>
  );
}

function TransactionDetailModal({ tx, onClose }: { tx: WalletTransaction | null; onClose: () => void }) {
  if (!tx) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose} role="dialog" aria-modal="true">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-6 space-y-4" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)", animation: "fadeIn 0.2s ease-out" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Detalhes</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }} aria-label="Fechar"><span style={{ color: "#9CA3AF" }}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span></button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Tipo</span><span className="text-white">{TXT_TYPE[tx.type] || tx.type}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Valor</span><span className={isCredit(tx.type) ? "text-green-400" : "text-red-400"}>{formatCurrency(tx.amount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={"font-medium " + (tx.status === "confirmed" ? "text-green-400" : tx.status === "failed" ? "text-red-400" : "text-yellow-400")}>{TXT_STATUS[tx.status] || tx.status}</span></div>
          {tx.description && <div className="flex justify-between"><span className="text-gray-500">Descricao</span><span className="text-white text-right max-w-[200px]">{tx.description}</span></div>}
          <div className="flex justify-between"><span className="text-gray-500">Data</span><span className="text-white">{new Date(tx.createdAt).toLocaleString("pt-BR")}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">ID</span><span className="text-gray-400 text-[10px] font-mono">{tx.id}</span></div>
        </div>
        <button type="button" onClick={onClose} className="w-full font-medium py-3 rounded-xl text-sm min-h-[44px]" style={{ background: "rgba(255,255,255,0.05)", color: "#D1D5DB" }}>Fechar</button>
      </div>
    </div>
  );
}
