export type DossierStatus =
  | 'NOUVEAU'
  | 'RAPPEL_1'
  | 'RAPPEL_2'
  | 'MISE_EN_DEMEURE'
  | 'BPOST_ENVOYE'
  | 'PROCEDURE_JUDICIAIRE'
  | 'PAYE'
  | 'ABANDONNE'

export type DebtorType = 'B2B' | 'B2C'

export interface DossierFilters {
  search?: string
  status?: DossierStatus | ''
  delayCategory?: 'lt30' | 'lt60' | 'lt90' | 'gt90' | ''
  amountRange?: 'lt1000' | '1000-5000' | '5000-20000' | 'gt20000' | ''
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface DossierSummary {
  total: number
  totalAmount: number
  avgDelay: number
  actionRequired: number
}

export interface KPIData {
  totalOutstanding: number
  recoveredThisMonth: number
  overdueGt60: number
  successRate: number
  dossierCount: number
}
