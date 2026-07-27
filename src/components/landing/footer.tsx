"use client"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-gray-100 py-12 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">T</span>
              </div>
              <span className="text-sm font-bold text-foreground">TXAP</span>
            </div>
            <p className="text-xs text-muted leading-relaxed max-w-xs">
              Mobilidade inteligente para todos. Solicite corridas, entregas e fretes em uma única plataforma.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Links</h4>
            <div className="space-y-2">
              <Link href="/terms" className="block text-xs text-muted hover:text-foreground transition-colors">Termos de Uso</Link>
              <Link href="/privacy" className="block text-xs text-muted hover:text-foreground transition-colors">Privacidade</Link>
              <button onClick={() => alert("Central de ajuda disponível em breve")} className="block text-xs text-muted hover:text-foreground transition-colors cursor-pointer">Ajuda</button>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Baixe o app</h4>
            <p className="text-xs text-muted mb-3">Disponível em breve na App Store e Google Play</p>
            <div className="flex gap-2">
              <div className="bg-gray-200 rounded-lg px-4 py-2 text-xs text-muted">App Store</div>
              <div className="bg-gray-200 rounded-lg px-4 py-2 text-xs text-muted">Google Play</div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6 text-center">
          <p className="text-xs text-muted">© 2026 TXAP. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
