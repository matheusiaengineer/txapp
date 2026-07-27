import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/hero"
import { ComoFunciona } from "@/components/landing/como-funciona"
import { Categorias } from "@/components/landing/categorias"
import { Depoimentos } from "@/components/landing/depoimentos"
import { SejaRemunerado } from "@/components/landing/seja-remunerado"
import { TrabalheConosco } from "@/components/landing/trabalhe-conosco"
import { Influencers } from "@/components/landing/influencers"
import { CtaFinal } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <main className="flex-1 flex flex-col min-h-[100dvh] bg-white">
      <Navbar />
      <Hero />
      <ComoFunciona />
      <Categorias />
      <Depoimentos />
      <SejaRemunerado />
      <TrabalheConosco />
      <Influencers />
      <CtaFinal />
      <Footer />
    </main>
  )
}
