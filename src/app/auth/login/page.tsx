"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Fingerprint, Smartphone, Apple, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CountrySelector } from "@/lib/components/country-selector";
import { COUNTRIES, type Country } from "@/lib/auth/countries";
import { signIn, getDashboardRoute } from "@/lib/auth/auth-service";
import { isBiometricSupported, loginWithBiometric, registerBiometric } from "@/lib/auth/webauthn";

type LoginMethod = "email" | "phone" | "biometric";

export default function LoginPage() {
  const router = useRouter();
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [method, setMethod] = useState<LoginMethod>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    isBiometricSupported().then(setBiometricAvailable);
  }, []);

  const methods = [
    { id: "email" as const, icon: <Mail className="w-5 h-5" />, label: "Email" },
    { id: "phone" as const, icon: <Smartphone className="w-5 h-5" />, label: "Telefone" },
    { id: "biometric" as const, icon: <Fingerprint className="w-5 h-5" />, label: "Biometria" },
  ];

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (method !== "email") return;
    setError(null);
    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    const role = (res.role || "passenger") as "passenger" | "driver" | "company" | "transporter" | "employee";
    router.push(getDashboardRoute(role));
  }

  async function handleBiometricLogin() {
    setBiometricLoading(true);
    setError(null);
    const res = await loginWithBiometric();
    setBiometricLoading(false);
    if (res.success && res.user) {
      router.push(getDashboardRoute(res.user.role || "passenger"));
    } else {
      setError(res.error || "Falha no login biométrico");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-6 md:mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 md:mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-background font-bold">TX</div>
            <span className="text-xl md:text-2xl font-bold text-white">TXD</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Entrar</h1>
          <p className="text-xs md:text-sm text-gray-400">Escolha como deseja acessar sua conta</p>
        </div>

        <div className="glass-panel p-5 md:p-8">
          <div className="mb-4 md:mb-6">
            <CountrySelector selected={country} onSelect={setCountry} />
          </div>

          <div className="flex bg-background rounded-xl p-0.5 md:p-1 mb-4 md:mb-6 border border-card-border">
            {methods.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  method === m.id ? "bg-primary text-background" : "text-gray-400 hover:text-white"
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-3 md:space-y-4">
            {method === "email" && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-col gap-1.5 md:gap-2">
                  <label className="text-xs md:text-sm text-gray-400">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-background border border-card-border rounded-lg p-3.5 md:p-3 text-white focus:border-primary focus:outline-none transition-colors"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:gap-2">
                  <label className="text-xs md:text-sm text-gray-400">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-background border border-card-border rounded-lg p-3.5 md:p-3 pr-12 text-white focus:border-primary focus:outline-none transition-colors"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 min-tap-target flex items-center justify-center text-gray-400 hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {method === "phone" && (
              <div className="flex flex-col gap-1.5 md:gap-2">
                <label className="text-xs md:text-sm text-gray-400">Telefone</label>
                <div className="flex gap-2">
                  <div className="bg-background border border-card-border rounded-lg px-3 flex items-center text-gray-400 text-sm">{country.phoneCode}</div>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="flex-1 bg-background border border-card-border rounded-lg p-3.5 md:p-3 text-white focus:border-primary focus:outline-none transition-colors"
                    placeholder="(00) 00000-0000" required />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Login por telefone em breve</p>
              </div>
            )}

            {method === "biometric" && (
              <div className="text-center py-6 md:py-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Fingerprint className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </div>
                {biometricAvailable ? (
                  <>
                    <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Toque para entrar com biometria</p>
                    <p className="text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4">Face ID, Touch ID ou impressão digital</p>
                    <button onClick={handleBiometricLogin} disabled={biometricLoading}
                      className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[0.98] shadow-[0_0_20px_rgba(62,203,142,0.2)]">
                      {biometricLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Fingerprint className="w-5 h-5" /> Entrar com Face ID</>}
                    </button>
                  </>
                ) : (
                  <p className="text-gray-400 text-xs md:text-sm mb-2">Biometria não disponível</p>
                )}
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs md:text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {method !== "biometric" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 accent-primary rounded bg-background border-card-border" />
                  <span className="text-xs md:text-sm text-gray-400">Lembrar-me</span>
                </label>
                <Link href="/auth/forgot-password" className="text-xs md:text-sm text-primary hover:underline">Esqueceu a senha?</Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || method !== "email"}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[0.98] shadow-[0_0_20px_rgba(62,203,142,0.2)]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : method === "phone" ? <>Em breve <ArrowRight className="w-5 h-5" /></> : method === "biometric" ? null : <>Entrar <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div className="relative my-5 md:my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-card-border" /></div>
            <div className="relative flex justify-center"><span className="bg-[#1c1c1c] px-4 text-xs md:text-sm text-gray-500">ou continue com</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button disabled className="flex items-center justify-center gap-2 py-3 md:py-3 bg-background border border-card-border rounded-xl opacity-50 cursor-not-allowed text-xs md:text-sm font-medium">
              <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Google
            </button>
            <button disabled className="flex items-center justify-center gap-2 py-3 md:py-3 bg-background border border-card-border rounded-xl opacity-50 cursor-not-allowed text-xs md:text-sm font-medium">
              <Apple className="w-4 h-4 md:w-5 md:h-5" /> Apple
            </button>
          </div>
          <p className="text-center text-xs text-gray-600 mt-2">Login social em breve</p>
        </div>

        <p className="text-center mt-5 md:mt-6 text-xs md:text-sm text-gray-500">
          Não tem conta?{" "}
          <Link href="/auth/register" className="text-primary hover:underline font-medium">Criar conta</Link>
        </p>
      </motion.div>
    </div>
  );
}
