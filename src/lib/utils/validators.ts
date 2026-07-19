// CPF validation (rule 107)
export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  for (let t = 9; t < 11; t++) {
    let d = 0;
    for (let c = 0; c < t; c++) d += parseInt(digits[c], 10) * ((t + 1) - c);
    d = ((10 * d) % 11) % 10;
    if (parseInt(digits[t], 10) !== d) return false;
  }
  return true;
}

export function validateCPF(cpf: string): string | null {
  return isValidCPF(cpf) ? null : "CPF inválido";
}

// Luhn algorithm for credit cards (rule 53)
export function isValidLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function validateCardNumber(number: string): string | null {
  return isValidLuhn(number) ? null : "Número de cartão inválido";
}

// Credit card brand detection from first digits (rule 135)
export function detectCardBrand(number: string): string {
  const clean = number.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^5[1-5]/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  if (/^6(?:011|5)/.test(clean)) return "discover";
  if (/^3(?:0[0-5]|[68])/.test(clean)) return "diners";
  if (/^(?:2131|1800|35)/.test(clean)) return "jcb";
  if (/^50|^6[0-9]/.test(clean)) return "elo";
  if (/^606282|^3841/.test(clean)) return "hipercard";
  return "unknown";
}

// Expiry date validation (rule 125)
export function isValidExpiry(month: number, year: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) return false;
  if (month < 1 || month > 12) return false;
  return true;
}

export function validateExpiry(month: number, year: number): string | null {
  return isValidExpiry(month, year) ? null : "Data de validade inválida";
}

// Password complexity (rule 145)
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Mínimo 8 caracteres";
  if (!/[A-Z]/.test(password)) return "Deve conter 1 letra maiúscula";
  if (!/[a-z]/.test(password)) return "Deve conter 1 letra minúscula";
  if (!/[0-9]/.test(password)) return "Deve conter 1 número";
  return null;
}

// Age validation: must be 18+ (rule 146)
export function isAtLeast18(birthDate: string): boolean {
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
}

export function validateAge(birthDate: string): string | null {
  return isAtLeast18(birthDate) ? null : "Deve ter pelo menos 18 anos";
}

// Phone BR format (rule 152)
export function isValidPhone(phone: string): boolean {
  return /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(phone);
}

export function validatePhone(phone: string): string | null {
  return isValidPhone(phone) ? null : "Telefone inválido";
}

// CEP mask + ViaCEP integration (rule 160)
export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isCEPComplete(cep: string): boolean {
  return cep.replace(/\D/g, "").length === 8;
}

// Currency input mask (rule 47)
export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  const cents = parseInt(digits || "0", 10);
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  return `R$ ${reais.toLocaleString("pt-BR")},${String(centavos).padStart(2, "0")}`;
}

// Bio character limit enforcement (rule 151)
export function truncateBio(text: string, maxLength = 150): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength);
}
