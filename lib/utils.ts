import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = 'EUR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatDate(date: Date | string, formatStr = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, formatStr, { locale: fr })
}

export function getDaysOverdue(dueDate: Date | string): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  return differenceInDays(new Date(), due)
}

export function getDelayCategory(daysOverdue: number): string {
  if (daysOverdue <= 0) return 'current'
  if (daysOverdue <= 30) return 'lt30'
  if (daysOverdue <= 60) return 'lt60'
  if (daysOverdue <= 90) return 'lt90'
  return 'gt90'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NOUVEAU: 'Nouveau',
    RAPPEL_1: 'Rappel 1',
    RAPPEL_2: 'Rappel 2',
    MISE_EN_DEMEURE: 'Mise en demeure',
    BPOST_ENVOYE: 'bpost envoyé',
    PROCEDURE_JUDICIAIRE: 'Procédure judiciaire',
    PAYE: 'Payé',
    ABANDONNE: 'Abandonné',
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NOUVEAU: 'bg-gray-100 text-gray-700',
    RAPPEL_1: 'bg-yellow-100 text-yellow-700',
    RAPPEL_2: 'bg-orange-100 text-orange-700',
    MISE_EN_DEMEURE: 'bg-red-100 text-red-700',
    BPOST_ENVOYE: 'bg-purple-100 text-purple-700',
    PROCEDURE_JUDICIAIRE: 'bg-red-200 text-red-800',
    PAYE: 'bg-green-100 text-green-700',
    ABANDONNE: 'bg-gray-200 text-gray-600',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getDelayBadgeColor(daysOverdue: number): string {
  if (daysOverdue <= 0) return 'bg-green-100 text-green-700'
  if (daysOverdue <= 30) return 'bg-yellow-100 text-yellow-700'
  if (daysOverdue <= 60) return 'bg-orange-100 text-orange-700'
  if (daysOverdue <= 90) return 'bg-red-100 text-red-700'
  return 'bg-red-200 text-red-900'
}

// Belgian legal interest rate calculation (loi du 2 août 2002)
export function calculateLegalInterest(
  principal: number,
  rate: number, // annual rate e.g. 0.12
  startDate: Date,
  endDate: Date = new Date()
): number {
  const days = differenceInDays(endDate, startDate)
  if (days <= 0) return 0
  return principal * rate * (days / 365)
}

// B2C caps according to loi du 4 mai 2023
export function calculateB2CCap(principal: number): { maxFee: number; maxInterest: number } {
  if (principal <= 150) return { maxFee: 20, maxInterest: 30 }
  if (principal <= 500) return { maxFee: 30, maxInterest: 60 }
  return { maxFee: 65, maxInterest: principal * 0.15 } // 15% of principal
}

export function generateDossierNumber(sequence: number): string {
  const year = new Date().getFullYear()
  const padded = String(sequence).padStart(4, '0')
  return `DOS-${year}-${padded}`
}
