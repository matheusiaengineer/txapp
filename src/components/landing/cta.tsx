import Link from "next/link"

export function CtaFinal() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-lg mx-auto txd-card p-10 text-center relative overflow-hidden border-primary/20"
        style={{ background: "linear-gradient(135deg, rgba(62,203,142,0.06), transparent)" }}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-4">
            🚀 Comece agora
          </span>
          <h2 className="text-3xl font-bold text-foreground mb-3">Pronto para começar?</h2>
          <p className="text-sm text-muted mb-8 max-w-sm mx-auto">
            Milhares de pessoas já usam o TXAP. Junte-se você também e transforme sua mobilidade.
          </p>
          <Link href="/auth/register"
            className="bg-primary hover:bg-primary-hover text-white font-bold px-10 py-4 rounded-full txd-green-glow-sm inline-block transition-all hover:scale-[1.02] active:scale-[0.98]">
            Criar conta grátis
          </Link>
          <p className="text-xs text-muted mt-5">Sem cartão de crédito · Cadastro em 30 segundos</p>
        </div>
      </div>
    </section>
  )
}
