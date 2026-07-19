import { AuthProvider } from "@/components/landing/auth-context";
import { AuthModal } from "@/components/landing/AuthModal";
import { Navbar } from "@/components/landing/Navbar";
import { LocationBadge, HeroCtas, HeroStats, ActionCards } from "@/components/landing/HeroInteractive";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { BenefitsSection, LiveDriversSection, PlansSection } from "@/components/landing/InteractiveSections";
import { FadeInView } from "@/components/ui/FadeInView";
import { Icon } from "@/components/ui/Icon";

function SectionHeader({ badge, title, desc }: { badge: string; title: string; desc?: string }) {
  return (
    <div className="text-center mb-10 md:mb-16">
      <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-medium border border-primary/20 mb-3 md:mb-4">{badge}</span>
      <h2 className="text-2xl md:text-5xl font-bold tracking-tight mb-3 md:mb-4">{title}</h2>
      {desc && <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-lg px-4">{desc}</p>}
    </div>
  );
}

const steps = [
  { step: "01", title: "Solicitar", desc: "Origem, destino, categoria. Veja o preço na hora.", color: "#3ECB8E" },
  { step: "02", title: "Motorista aceita", desc: "Em média 3 segundos para encontrar um motorista.", color: "#60a5fa" },
  { step: "03", title: "Acompanhar", desc: "Mapa ao vivo com ETA e compartilhamento.", color: "#f59e0b" },
  { step: "04", title: "Pagamento", desc: "PIX, cartão ou dinheiro. Comissão automática.", color: "#a78bfa" },
  { step: "05", title: "Avaliação", desc: "Critérios específicos para cada tipo de serviço.", color: "#f472b6" },
];

const categories = [
  { icon: "car" as const, name: "Carro", price: "R$ 25", color: "#3ECB8E", desc: "Corridas rápidas" },
  { icon: "bike" as const, name: "Moto", price: "R$ 15", color: "#60a5fa", desc: "Entregas e corridas" },
  { icon: "package" as const, name: "Entregas", price: "R$ 10", color: "#f59e0b", desc: "Pequenos pacotes" },
  { icon: "heart" as const, name: "Farmácia", price: "R$ 8", color: "#ef4444", desc: "Remédios e saúde" },
  { icon: "zap" as const, name: "Alimentação", price: "R$ 9", color: "#a78bfa", desc: "Comida e bebidas" },
  { icon: "shopping-cart" as const, name: "Mercado", price: "R$ 12", color: "#34d399", desc: "Compras do dia" },
  { icon: "file-text" as const, name: "Documentos", price: "R$ 12", color: "#f472b6", desc: "Envio de docs" },
  { icon: "package" as const, name: "Encomendas", price: "R$ 14", color: "#38bdf8", desc: "Pacotes maiores" },
  { icon: "truck" as const, name: "Frete", price: "Orçamento", color: "#fb923c", desc: "Cargas e volumes" },
  { icon: "briefcase" as const, name: "Mudanças", price: "Orçamento", color: "#e879f9", desc: "Móveis e objetos" },
  { icon: "building-2" as const, name: "Materiais", price: "Orçamento", color: "#fbbf24", desc: "Construção" },
  { icon: "car" as const, name: "Van", price: "Orçamento", color: "#6ee7b7", desc: "Grupos e cargas" },
  { icon: "globe" as const, name: "Viagens", price: "Orçamento", color: "#67e8f9", desc: "Entre cidades" },
  { icon: "truck" as const, name: "Cargas", price: "Orçamento", color: "#fdba74", desc: "Pesadas" },
  { icon: "building-2" as const, name: "Empresarial", price: "Sob consulta", color: "#a78bfa", desc: "B2B" },
];

const safetyItems = [
  { icon: "shield" as const, title: "Verificação de documentos", desc: "KYC completo com reconhecimento facial" },
  { icon: "check-circle" as const, title: "Motoristas aprovados", desc: "Fluxo de aprovação rigoroso" },
  { icon: "navigation" as const, title: "Compartilhamento de viagem", desc: "Familiares acompanham sua rota" },
  { icon: "alert-triangle" as const, title: "Botão de emergência", desc: "SOS com localização em tempo real" },
  { icon: "star" as const, title: "Avaliações mútuas", desc: "Passageiros e motoristas se avaliam" },
  { icon: "lock" as const, title: "RLS em todas as tabelas", desc: "Cada usuário vê apenas seus dados" },
  { icon: "camera" as const, title: "Monitoramento de fraude", desc: "Detecção de GPS spoofing" },
  { icon: "bell" as const, title: "Alertas em tempo real", desc: "Notificações de segurança instantâneas" },
  { icon: "clock" as const, title: "Backups automáticos", desc: "Dados protegidos e replicados" },
  { icon: "lock" as const, title: "JWT com expiração curta", desc: "Tokens de 15 minutos de validade" },
  { icon: "shield" as const, title: "2FA para administradores", desc: "Autenticação de dois fatores" },
];

const pwaBenefits = [
  "Parece um app premium",
  "Carrega em <1s (cold start)",
  "Funciona offline",
  "Mapa abre instantaneamente",
  "Notificações push nativas",
  "Solicitar corrida em <30s",
  "60fps nas animações",
  "Ocupa <1MB no celular",
];

const footerColumns = [
  { title: "Produto", links: ["Passageiros", "Motoristas", "Empresas", "Entregas", "Fretes"] },
  { title: "Empresa", links: ["Sobre", "Blog", "Carreiras", "Parceiros", "Contato"] },
  { title: "Recursos", links: ["Central de ajuda", "Segurança", "Desenvolvedores", "API", "Status"] },
  { title: "Legal", links: ["Privacidade", "Termos", "LGPD", "Cookies", "Compliance"] },
];

export default function Home() {
  return (
    <AuthProvider>
      <Navbar />
      <AuthModal />

      <main className="flex-1 flex flex-col min-h-[100dvh] relative bg-[#0a0d12]">
        {/* HERO */}
        <section className="relative min-h-[100dvh] flex flex-col items-center pt-24 md:pt-28 pb-12 md:pb-16 px-4 md:px-6 txd-radial-glow" aria-label="Hero">
          <div className="absolute inset-0 txd-grid-bg opacity-40" />
          <div className="max-w-7xl mx-auto w-full relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <LocationBadge />
                <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.15] mb-5">
                  Mobilidade inteligente para{" "}
                  <span className="txd-gradient-text txd-text-glow">todos</span>.
                </h1>
                <p className="text-sm sm:text-lg md:text-xl text-gray-400 mb-7 max-w-lg leading-relaxed">Solicite corridas, entregas e fretes em uma única plataforma.</p>
                <HeroCtas />
                <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm">
                  <div className="flex items-center gap-1.5 md:gap-2 text-gray-400"><Icon name="shield" size={16} className="text-primary" />Motoristas verificados</div>
                  <div className="flex items-center gap-1.5 md:gap-2 text-gray-400"><Icon name="navigation" size={16} className="text-primary" />Rastreamento</div>
                  <div className="flex items-center gap-1.5 md:gap-2 text-gray-400"><Icon name="credit-card" size={16} className="text-primary" />Pagamento flexível</div>
                </div>
              </div>
              <div className="relative hidden lg:flex items-center justify-center" aria-hidden="true">
                <div className="relative">
                  <div className="absolute -inset-10 bg-gradient-radial from-primary/30 via-primary/10 to-transparent blur-3xl opacity-40 animate-txd-float" />
                  <div className="relative w-72 h-72 rounded-full border border-primary/20 bg-black/40 flex items-center justify-center" style={{ backdropFilter: "blur(24px)" }}>
                    <div className="text-center">
                      <div className="txd-gradient-text text-6xl font-bold">4.9★</div>
                      <div className="text-sm text-gray-500">Avaliação</div>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 -left-8 w-24 h-24 rounded-2xl border border-primary/20 bg-black/40 flex items-center justify-center" style={{ backdropFilter: "blur(24px)" }}>
                    <div className="text-center">
                      <div className="text-primary font-bold text-lg">3s</div>
                      <div className="text-[8px] text-gray-500">aceite</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 md:mt-16">
              <ActionCards />
              <HeroStats />
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="py-16 md:py-24 px-4 md:px-6 relative" aria-label="Como funciona" style={{ contentVisibility: "auto" }}>
          <SectionHeader badge="Como funciona" title="Tudo em 5 passos simples" desc="Do pedido à avaliação, tudo pensado para ser rápido e intuitivo." />
          <div className="max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-6">
              {steps.map((s, i) => (
                <div key={i} className="txd-card p-4 md:p-6 text-center relative z-10 txd-card-hover transition-all animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-base md:text-lg font-bold mx-auto mb-3 md:mb-4" style={{ background: `${s.color}20`, color: s.color }}>{s.step}</div>
                  <h3 className="font-semibold text-sm md:text-lg mb-1 md:mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-xs md:text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CATEGORIAS */}
        <section id="categorias" className="py-16 md:py-24 px-4 md:px-6 relative txd-radial-glow" aria-label="Categorias" style={{ contentVisibility: "auto" }}>
          <div className="absolute inset-0 txd-grid-bg opacity-20" />
          <SectionHeader badge="Categorias" title="15 categorias de serviço" desc="Do transporte de passageiros ao frete pesado, tudo num só lugar." />
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {categories.map((cat, i) => (
              <div key={i} className="txd-card p-3 md:p-5 group txd-card-hover transition-all animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2 md:mb-3 transition-transform group-hover:scale-110" style={{ background: `${cat.color}15` }}>
                  <Icon name={cat.icon} size={20} style={{ color: cat.color }} />
                </div>
                <div className="font-semibold text-xs md:text-sm">{cat.name}</div>
                <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">{cat.desc}</div>
                <div className="text-primary text-[10px] md:text-xs font-bold mt-1 md:mt-2">{cat.price}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">+21 categorias · 19 moedas · 15 idiomas</p>
        </section>

        {/* BENEFICIOS */}
        <section id="beneficios" className="py-16 md:py-24 px-4 md:px-6" aria-label="Benefícios">
          <SectionHeader badge="Benefícios" title="Vantagens para cada perfil" desc="Seja passageiro, motorista ou empresa — o TXDAPP foi feito para você." />
          <BenefitsSection />
        </section>

        {/* APP PREVIEW */}
        <section id="app" className="py-16 md:py-24 px-4 md:px-6 relative txd-radial-glow" aria-label="App">
          <div className="absolute inset-0 txd-grid-bg opacity-20" />
          <SectionHeader badge="App Preview" title="Conheça a plataforma" desc="Quatro dashboards completos dentro de um só aplicativo." />
          <DashboardPreview />
        </section>

        {/* SEGURANCA */}
        <section id="seguranca" className="py-16 md:py-24 px-4 md:px-6" aria-label="Segurança" style={{ contentVisibility: "auto" }}>
          <SectionHeader badge="Segurança" title="Trust & Safety Engine" desc="Sua segurança é nossa prioridade número um." />
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {safetyItems.map((s, i) => (
              <div key={i} className="txd-card p-4 md:p-5 flex items-start gap-3 md:gap-4 animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><Icon name={s.icon} size={20} className="text-primary" /></div>
                <div><h3 className="font-semibold text-xs md:text-sm mb-0.5 md:mb-1">{s.title}</h3><p className="text-gray-400 text-[10px] md:text-xs">{s.desc}</p></div>
              </div>
            ))}
          </div>
          <div className="max-w-4xl mx-auto mt-8 txd-card p-6 text-center">
            <div className="flex flex-wrap justify-center gap-4">
              {["LGPD", "GDPR", "CCPA", "ISO 27001 ready", "PCI-DSS"].map(b => (
                <span key={b} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300">{b}</span>
              ))}
            </div>
          </div>
        </section>

        {/* TXD LIVE */}
        <section className="py-16 md:py-24 px-4 md:px-6 relative txd-radial-glow" aria-label="Motoristas ao vivo" style={{ contentVisibility: "auto" }}>
          <div className="absolute inset-0 txd-grid-bg opacity-20" />
          <SectionHeader badge="TXD Live" title="Motoristas ao vivo" desc="Veja quem está disponível agora na sua região." />
          <LiveDriversSection />
        </section>

        {/* PLANOS */}
        <section id="planos" className="py-16 md:py-24 px-4 md:px-6" aria-label="Planos">
          <SectionHeader badge="Preços" title="Planos para todos" desc="Do passageiro à grande empresa, temos o plano certo." />
          <PlansSection />
          <div className="max-w-md mx-auto mt-8 txd-card p-5 text-center">
            <Icon name="building-2" size={32} className="text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-300">Tudo configurável por cidade — preços, comissões e regras no banco de dados.</p>
          </div>
        </section>

        {/* DOWNLOAD */}
        <section className="py-16 md:py-24 px-4 md:px-6 relative txd-radial-glow" aria-label="Download" style={{ contentVisibility: "auto" }}>
          <div className="absolute inset-0 txd-grid-bg opacity-20" />
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">Download</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Baixe o TXDAPP</h2>
              <p className="text-gray-400 mb-6">Instale na tela inicial. Funciona como app nativo. 100% grátis. Menos de 1MB.</p>
              <div className="flex flex-wrap gap-3 mb-6">
                <button className="bg-black hover:bg-gray-900 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 transition hover:border-primary/30">
                  <Icon name="smartphone" size={20} className="text-primary" />
                  <span className="text-sm font-medium"><span className="text-xs text-gray-500 block">Google Play</span>Instalar PWA</span>
                </button>
                <button className="bg-black hover:bg-gray-900 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 transition hover:border-primary/30">
                  <Icon name="smartphone" size={20} className="text-primary" />
                  <span className="text-sm font-medium"><span className="text-xs text-gray-500 block">App Store</span>Em breve</span>
                </button>
                <button className="bg-black hover:bg-gray-900 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 transition hover:border-primary/30">
                  <Icon name="globe" size={20} className="text-primary" />
                  <span className="text-sm font-medium"><span className="text-xs text-gray-500 block">Web App</span>Instalar PWA</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="txd-card p-4">
                  <p className="text-xs font-semibold mb-2 text-center">📱 Android (Chrome)</p>
                  <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Abra no <strong className="text-white">Chrome</strong></li>
                    <li>Toque em "Instalar" no banner</li>
                    <li>Pronto! Ícone na tela inicial</li>
                  </ol>
                </div>
                <div className="txd-card p-4">
                  <p className="text-xs font-semibold mb-2 text-center">🍎 iPhone (Safari)</p>
                  <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Abra no <strong className="text-white">Safari</strong></li>
                    <li>Toque em <strong className="text-white">Compartilhar</strong> (📤)</li>
                    <li><strong className="text-white">Adicionar à Tela de Início</strong></li>
                  </ol>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 txd-glass-strong rounded-2xl flex items-center justify-center border border-primary/20">
                  <Icon name="qr-code" size={40} className="text-primary" />
                </div>
                <div className="text-xs text-gray-500">
                  <p className="font-semibold text-gray-300 mb-1">Escaneie o QR Code</p>
                  <p>Para instalar direto no celular</p>
                </div>
              </div>
            </div>
            <div className="txd-card p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-4xl animate-txd-float">🚀</div>
              <h3 className="font-bold text-lg mb-4">App nativo sem instalação?</h3>
              <p className="text-sm text-gray-400 mb-4">O TXDAPP é um <strong className="text-white">PWA (Progressive Web App)</strong>:</p>
              <ul className="space-y-3 mb-6">
                {pwaBenefits.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm"><Icon name="check-circle" size={16} className="text-primary shrink-0" />{item}</li>
                ))}
              </ul>
              <div className="flex gap-6 text-sm">
                <div><div className="txd-gradient-text font-bold">&lt;1s</div><div className="text-gray-500 text-xs">cold start</div></div>
                <div><div className="txd-gradient-text font-bold">60fps</div><div className="text-gray-500 text-xs">animações</div></div>
                <div><div className="txd-gradient-text font-bold">&lt;1MB</div><div className="text-gray-500 text-xs">tamanho</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-16 md:py-24 px-4 md:px-6" aria-label="Chamada para ação" style={{ contentVisibility: "auto" }}>
          <div className="max-w-4xl mx-auto txd-card p-8 md:p-16 text-center relative overflow-hidden border-primary/20"
            style={{ background: "linear-gradient(135deg, rgba(62,203,142,0.08), transparent)" }}>
            <div className="absolute inset-0 txd-grid-bg opacity-20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">Beta aberto na sua região</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Pronto para se mover com inteligência?</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">Milhares de pessoas já estão usando. Junte-se você também.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/auth/register" className="bg-primary hover:bg-primary-hover text-black font-bold px-8 py-3.5 rounded-full txd-green-glow-sm inline-block">Criar conta grátis</a>
                <a href="/auth/login" className="border border-white/10 hover:bg-white/10 text-white font-medium px-8 py-3.5 rounded-full inline-block">Já tenho conta</a>
              </div>
              <p className="text-xs text-gray-500 mt-4">Sem cartão de crédito · Cadastro em 30 segundos · Suporte humano 24/7</p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/5 py-12 px-6" aria-label="Rodapé">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3ECB8E] to-[#2da874] flex items-center justify-center"><Icon name="car" size={16} className="text-black" /></div>
                  <span className="font-bold text-lg"><span className="text-white">TX</span><span className="txd-gradient-text">DAPP</span></span>
                </div>
                <p className="text-gray-500 text-sm mb-4 max-w-xs">O Sistema Operacional Global de Mobilidade e Logística.</p>
                <div className="flex gap-2 mb-4">{["🇧🇷","🇺🇸","🇵🇹","🇲🇽"].map((f, i) => <span key={i} className="text-lg" aria-label={f}>{f}</span>)}</div>
                <div className="text-xs text-gray-600">4 países · 7 cidades · 19 moedas · 15 idiomas</div>
              </div>
              {footerColumns.map((col, i) => (
                <div key={i}>
                  <h4 className="font-bold text-sm text-white mb-4">{col.title}</h4>
                  <ul className="space-y-2">
                    {col.links.map((l, j) => <li key={j} className="text-sm text-gray-500 hover:text-gray-300 cursor-pointer transition">{l}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <hr className="border-white/5 mb-6" />
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
              <span>© 2025 TXDAPP. Todos os direitos reservados.</span>
              <span>Sistemas operacionais · v0.1.0-beta</span>
            </div>
          </div>
        </footer>
      </main>
    </AuthProvider>
  );
}
