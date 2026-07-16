const PASSPORT_PATTERNS: Record<string, RegExp> = {
  BR: /^[A-Z]{2}\d{6}$/,
  US: /^\d{9}$/,
  PT: /^[A-Z]{2}\d{6}$/,
  AR: /^[A-Z]{3}\d{6}$/,
  MX: /^\d{9}$/,
  CO: /^[A-Z]{2}\d{7}$/,
  CL: /^[A-Z0-9]{8,9}$/,
  PE: /^[A-Z]{2}\d{6}$/,
  GB: /^\d{9}$/,
  ES: /^[A-Z]{3}\d{6}$/,
  FR: /^\d{9}[A-Z]{2}\d{3}$/,
  DE: /^[A-Z0-9]{9}$/,
  IT: /^[A-Z0-9]{9}$/,
  JP: /^[A-Z]{2}\d{7}$/,
  CN: /^[A-Z]\d{8}$/,
  IN: /^[A-Z]\d{7}$/,
  AO: /^[A-Z]{2}\d{6}$/,
  MZ: /^[A-Z]{2}\d{6}$/,
  NG: /^[A-Z]\d{8}$/,
  ZA: /^[A-Z0-9]{8,9}$/,
};

export function validatePassport(passport: string, countryCode: string): boolean {
  const pattern = PASSPORT_PATTERNS[countryCode];
  if (!pattern) return /^[A-Z0-9]{6,12}$/i.test(passport);
  return pattern.test(passport.toUpperCase());
}
