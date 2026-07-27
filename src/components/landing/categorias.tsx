const categories = [
  { name: "Carro", desc: "Passageiros", icon: "🚗", color: "bg-green-100 text-green-600" },
  { name: "Moto", desc: "Mototáxi", icon: "🏍️", color: "bg-blue-100 text-blue-600" },
  { name: "Motoboy", desc: "Entregas rápidas", icon: "📦", color: "bg-amber-100 text-amber-600" },
  { name: "Caminhão", desc: "Fretes", icon: "🚛", color: "bg-orange-100 text-orange-600" },
  { name: "Van", desc: "Grupos", icon: "🚐", color: "bg-green-100 text-green-600" },
  { name: "Fiorino", desc: "Cargas leves", icon: "🚚", color: "bg-purple-100 text-purple-600" },
]

export function Categorias() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-4">
            Categorias
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Para todo tipo de viagem</h2>
          <p className="text-sm text-muted mt-2">Escolha o veículo ideal para cada necessidade</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <div key={cat.name} className="txd-card p-6 text-center hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 group bg-white">
              <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-0.5">{cat.name}</h3>
              <p className="text-xs text-muted">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
