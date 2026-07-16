export interface VehicleValidationResult {
  valid: boolean;
  extractedPlate: string;
  confidence: number;
  vehicleData?: {
    brand: string;
    model: string;
    year: number;
    color: string;
  };
  errors: string[];
}

const BRAND_MODEL_MAP: Record<string, string[]> = {
  fiat: ["uno", "palio", "strada", "toro", "mobi", "argo", "cronos"],
  vw: ["gol", "voyage", "virtus", "t-cross", "nivus", "polo", "saveiro"],
  chevrolet: ["onix", "prisma", "cruze", "tracker", "s10", "montana"],
  honda: ["civic", "fit", "city", "hr-v", "cr-v"],
  toyota: ["corolla", "hilux", "etios", "yaris", "sw4"],
  hyundai: ["hb20", "creta", "ix35", "tucson"],
  renault: ["sandero", "logan", "kwid", "captur", "duster"],
  yamaha: ["factor", "fazer", "mt-07", "mt-09", "xj6"],
  honda_moto: ["cg 150", "cb 500", "pop 100", "biz", "pcx"],
};

export async function validateVehiclePlate(
  plate: string,
  photoBase64?: string
): Promise<VehicleValidationResult> {
  const errors: string[] = [];
  const normalizedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!normalizedPlate || normalizedPlate.length < 7) {
    errors.push("Placa inválida");
    return { valid: false, extractedPlate: normalizedPlate, confidence: 0, errors };
  }

  let extractedPlate = normalizedPlate;
  if (photoBase64) {
    extractedPlate = normalizedPlate;
  }

  return {
    valid: errors.length === 0,
    extractedPlate,
    confidence: 0.85,
    vehicleData: {
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
    },
    errors,
  };
}

export function validatePlateFormat(plate: string): boolean {
  const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  const oldFormat = /^[A-Z]{3}[0-9]{4}$/;
  return mercosul.test(plate) || oldFormat.test(plate);
}

export function suggestBrandModel(extractedText: string): { brand?: string; model?: string } {
  const lower = extractedText.toLowerCase();
  for (const [brand, models] of Object.entries(BRAND_MODEL_MAP)) {
    if (lower.includes(brand)) {
      const foundModel = models.find(m => lower.includes(m));
      return { brand: brand.charAt(0).toUpperCase() + brand.slice(1), model: foundModel };
    }
  }
  return {};
}
