export interface ServiceCategory {
  id: string;
  name: string;
  namePt: string;
  icon: string;
  color: string;
  type: "passenger" | "freight" | "both";
  description: string;
  descriptionPt: string;
  capacity: number;
  maxWeight?: number;
  baseFare: number;
  pricePerKm: number;
  pricePerMin: number;
  minFare: number;
  cancellationFee: number;
  waitingFeePerMin: number;
  surgeMultiplier: boolean;
  availableVehicles: string[];
  requiresCarSeat?: boolean;
  accessible?: boolean;
  petFriendly?: boolean;
  womenOnly?: boolean;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: "moto", name: "TXD Moto", namePt: "TXD Moto", icon: "bike", color: "#FF6B35", type: "passenger", description: "Fast motorcycle ride", descriptionPt: "Corrida rápida de moto", capacity: 1, baseFare: 3, pricePerKm: 1.5, pricePerMin: 0.3, minFare: 7, cancellationFee: 5, waitingFeePerMin: 0.5, surgeMultiplier: true, availableVehicles: ["motorcycle"] },
  { id: "moto_luxo", name: "TXD Moto Luxo", namePt: "TXD Moto Luxo", icon: "bike", color: "#FFD700", type: "passenger", description: "Premium motorcycle with helmet", descriptionPt: "Moto premium com capacete incluso", capacity: 1, baseFare: 5, pricePerKm: 2.5, pricePerMin: 0.5, minFare: 10, cancellationFee: 7, waitingFeePerMin: 1, surgeMultiplier: true, availableVehicles: ["motorcycle"] },
  { id: "moto_entrega", name: "TXD Moto Entrega", namePt: "TXD Moto Entrega", icon: "package", color: "#FF6B35", type: "freight", description: "Small item delivery by motorcycle", descriptionPt: "Entrega de pequenos objetos de moto", capacity: 1, maxWeight: 10, baseFare: 5, pricePerKm: 2, pricePerMin: 0.5, minFare: 8, cancellationFee: 5, waitingFeePerMin: 0.5, surgeMultiplier: true, availableVehicles: ["motorcycle"] },
  { id: "pop", name: "TXD Pop", namePt: "TXD Pop", icon: "car", color: "#3ECB8E", type: "passenger", description: "Affordable everyday ride", descriptionPt: "Corrida econômica do dia a dia", capacity: 4, baseFare: 5, pricePerKm: 1.8, pricePerMin: 0.4, minFare: 10, cancellationFee: 7, waitingFeePerMin: 0.5, surgeMultiplier: true, availableVehicles: ["hatchback", "sedan"] },
  { id: "comfort", name: "TXD Comfort", namePt: "TXD Comfort", icon: "car", color: "#4A90D9", type: "passenger", description: "Comfortable sedan with AC", descriptionPt: "Carro sedã confortável com ar condicionado", capacity: 4, baseFare: 7, pricePerKm: 2.5, pricePerMin: 0.6, minFare: 15, cancellationFee: 10, waitingFeePerMin: 1, surgeMultiplier: true, availableVehicles: ["sedan", "suv"] },
  { id: "black", name: "TXD Black", namePt: "TXD Black", icon: "car", color: "#1A1A2E", type: "passenger", description: "Premium car, suited driver", descriptionPt: "Carro premium, motorista de terno", capacity: 4, baseFare: 12, pricePerKm: 4, pricePerMin: 1, minFare: 25, cancellationFee: 15, waitingFeePerMin: 2, surgeMultiplier: true, availableVehicles: ["luxury_sedan", "suv"] },
  { id: "van", name: "TXD Van", namePt: "TXD Van", icon: "truck", color: "#9B59B6", type: "passenger", description: "Up to 15 passengers", descriptionPt: "Até 15 passageiros", capacity: 15, baseFare: 15, pricePerKm: 3.5, pricePerMin: 0.8, minFare: 30, cancellationFee: 15, waitingFeePerMin: 1.5, surgeMultiplier: true, availableVehicles: ["van", "minibus"] },
  { id: "executivo", name: "TXD Executivo", namePt: "TXD Executivo", icon: "briefcase", color: "#2C3E50", type: "passenger", description: "Corporate executive transfer", descriptionPt: "Transfer empresarial executivo", capacity: 4, baseFare: 20, pricePerKm: 5, pricePerMin: 1.2, minFare: 40, cancellationFee: 20, waitingFeePerMin: 3, surgeMultiplier: false, availableVehicles: ["luxury_sedan", "suv"] },
  { id: "pet", name: "TXD Pet", namePt: "TXD Pet", icon: "dog", color: "#E67E22", type: "passenger", description: "Pet-friendly ride", descriptionPt: "Carro adaptado para animais", capacity: 3, baseFare: 8, pricePerKm: 2.8, pricePerMin: 0.6, minFare: 15, cancellationFee: 10, waitingFeePerMin: 1, surgeMultiplier: true, availableVehicles: ["hatchback", "sedan", "suv"], petFriendly: true },
  { id: "bike", name: "TXD Bike", namePt: "TXD Bike", icon: "bike", color: "#27AE60", type: "passenger", description: "Bicycle ride", descriptionPt: "Transporte por bicicleta", capacity: 1, baseFare: 2, pricePerKm: 1, pricePerMin: 0.2, minFare: 5, cancellationFee: 3, waitingFeePerMin: 0.3, surgeMultiplier: false, availableVehicles: ["bicycle"] },
  { id: "group", name: "TXD Grupo", namePt: "TXD Grupo", icon: "users", color: "#3498DB", type: "passenger", description: "Group ride, split fare", descriptionPt: "Viagem em grupo, divisão de valor", capacity: 6, baseFare: 10, pricePerKm: 3, pricePerMin: 0.7, minFare: 20, cancellationFee: 12, waitingFeePerMin: 1.5, surgeMultiplier: true, availableVehicles: ["suv", "van"] },
  { id: "compartilhado", name: "TXD Compartilhado", namePt: "TXD Compartilhado", icon: "users", color: "#1ABC9C", type: "passenger", description: "Share your ride, split costs", descriptionPt: "Carona dividindo rota e custos", capacity: 4, baseFare: 3, pricePerKm: 1, pricePerMin: 0.2, minFare: 5, cancellationFee: 3, waitingFeePerMin: 0.3, surgeMultiplier: false, availableVehicles: ["hatchback", "sedan"] },
  { id: "acessivel", name: "TXD Acessível", namePt: "TXD Acessível", icon: "accessibility", color: "#8E44AD", type: "passenger", description: "Wheelchair accessible vehicle", descriptionPt: "Veículo adaptado para cadeirantes", capacity: 3, baseFare: 10, pricePerKm: 3, pricePerMin: 0.7, minFare: 20, cancellationFee: 10, waitingFeePerMin: 1, surgeMultiplier: false, availableVehicles: ["adapted_van"], accessible: true },
  { id: "crianca", name: "TXD Criança", namePt: "TXD Criança", icon: "baby", color: "#E91E63", type: "passenger", description: "Child car seat included", descriptionPt: "Cadeirinha infantil inclusa", capacity: 3, baseFare: 8, pricePerKm: 2.8, pricePerMin: 0.6, minFare: 15, cancellationFee: 10, waitingFeePerMin: 1, surgeMultiplier: true, availableVehicles: ["sedan", "suv"], requiresCarSeat: true },
  { id: "feminino", name: "TXD Feminino", namePt: "TXD Feminino", icon: "venus", color: "#FF69B4", type: "passenger", description: "Women drivers for women passengers", descriptionPt: "Motoristas mulheres para passageiras", capacity: 4, baseFare: 5, pricePerKm: 1.8, pricePerMin: 0.4, minFare: 10, cancellationFee: 7, waitingFeePerMin: 0.5, surgeMultiplier: true, availableVehicles: ["hatchback", "sedan"], womenOnly: true },
  { id: "rotas_fixas", name: "TXD Rotas Fixas", namePt: "TXD Rotas Fixas", icon: "route", color: "#F39C12", type: "passenger", description: "Fixed route, scheduled times", descriptionPt: "Linhas fixas com horários agendados", capacity: 15, baseFare: 5, pricePerKm: 1, pricePerMin: 0.2, minFare: 5, cancellationFee: 3, waitingFeePerMin: 0.3, surgeMultiplier: false, availableVehicles: ["van", "minibus"] },
  { id: "carga_leve", name: "TXD Carga Leve", namePt: "TXD Carga Leve", icon: "package", color: "#E74C3C", type: "freight", description: "Light cargo up to 100kg", descriptionPt: "Carga leve até 100kg", capacity: 1, maxWeight: 100, baseFare: 10, pricePerKm: 2.5, pricePerMin: 0.5, minFare: 15, cancellationFee: 10, waitingFeePerMin: 0.5, surgeMultiplier: true, availableVehicles: ["van", "pickup"] },
  { id: "carga_media", name: "TXD Carga Média", namePt: "TXD Carga Média", icon: "package", color: "#C0392B", type: "freight", description: "Medium cargo up to 500kg", descriptionPt: "Carga média até 500kg", capacity: 1, maxWeight: 500, baseFare: 20, pricePerKm: 4, pricePerMin: 0.8, minFare: 30, cancellationFee: 20, waitingFeePerMin: 1, surgeMultiplier: true, availableVehicles: ["truck_small", "pickup"] },
  { id: "carga_pesada", name: "TXD Carga Pesada", namePt: "TXD Carga Pesada", icon: "truck", color: "#922B21", type: "freight", description: "Heavy cargo up to 5 tons", descriptionPt: "Carga pesada até 5 toneladas", capacity: 1, maxWeight: 5000, baseFare: 40, pricePerKm: 6, pricePerMin: 1.5, minFare: 60, cancellationFee: 30, waitingFeePerMin: 2, surgeMultiplier: true, availableVehicles: ["truck_medium", "truck_large"] },
  { id: "mudanca", name: "TXD Mudança", namePt: "TXD Mudança", icon: "home", color: "#D35400", type: "freight", description: "Moving truck with helpers", descriptionPt: "Caminhão de mudança com ajudantes", capacity: 1, maxWeight: 3000, baseFare: 80, pricePerKm: 8, pricePerMin: 2, minFare: 100, cancellationFee: 50, waitingFeePerMin: 3, surgeMultiplier: false, availableVehicles: ["truck_medium", "truck_large"] },
];

export function getCategory(id: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find(c => c.id === id);
}
