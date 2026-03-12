// Belgian legal interest rates (taux d'intérêt légal) per semester
// Source: SPF Economie - Loi du 2 août 2002 (B2B)
export const LEGAL_RATES: Record<string, number> = {
  '2024-1': 0.1300, // 13% - H1 2024
  '2024-2': 0.1300, // 13% - H2 2024
  '2025-1': 0.1200, // 12% - H1 2025
  '2025-2': 0.1200, // 12% - H2 2025
  '2026-1': 0.1150, // 11.5% - H1 2026 (estimated)
}

export function getCurrentLegalRate(): number {
  const now = new Date()
  const year = now.getFullYear()
  const semester = now.getMonth() < 6 ? 1 : 2
  const key = `${year}-${semester}`
  return LEGAL_RATES[key] || 0.12 // fallback 12%
}

export function getRateForDate(date: Date): number {
  const year = date.getFullYear()
  const semester = date.getMonth() < 6 ? 1 : 2
  const key = `${year}-${semester}`
  return LEGAL_RATES[key] || 0.12
}

// B2B flat fee (art. 6 loi du 2 août 2002)
export const B2B_FLAT_FEE = 40

// B2C fee caps (loi du 4 mai 2023)
export function getB2CMaxFee(principal: number): number {
  if (principal <= 150) return 20
  if (principal <= 500) return 30
  return 65
}

export function getB2CMaxInterest(principal: number): number {
  if (principal <= 150) return 30
  if (principal <= 500) return 60
  return principal * 0.15
}
