export const PLATFORM_COMMISSION_PERCENT = 0.10

export const DRIVER_SHARE_PERCENT = 1 - PLATFORM_COMMISSION_PERCENT

export const STRIPE_API_VERSION = "2025-03-31.basil" as const

export const REQUIRED_DEPOSITS: Record<string, number> = {
  moto: 15,
  carro: 25,
  freight: 30,
}
