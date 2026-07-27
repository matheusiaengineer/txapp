"use client"
import Link from "next/link"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}>
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-[#00a884] flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        <span className="font-bold text-lg text-foreground">TXAP</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/auth/login" className="text-sm text-muted font-medium hover:text-foreground transition-colors px-4 py-2">
          Entrar
        </Link>
        <Link href="/auth/register" className="text-sm bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2 rounded-full transition-all active:scale-[0.97]">
          Criar conta
        </Link>
      </div>
    </nav>
  )
}
