'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatCurrency, formatDate, getDaysOverdue, getStatusLabel, getStatusColor, getDelayBadgeColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import NouveauDossierModal from './nouveau-dossier-modal'

interface Dossier {
  id: string
  numero: string
  status: string
  debtorName: string
  debtorEmail: string | null
  originalAmount: number
  paidAmount: number
  dueDate: string
  invoiceNumber: string | null
  debtorType: string
  updatedAt: string
}

interface DossiersResponse {
  dossiers: Dossier[]
  total: number
  summary: {
    totalAmount: number
    avgDelay: number
    actionRequired: number
  }
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'NOUVEAU', label: 'Nouveau' },
  { value: 'RAPPEL_1', label: 'Rappel 1' },
  { value: 'RAPPEL_2', label: 'Rappel 2' },
  { value: 'MISE_EN_DEMEURE', label: 'Mise en demeure' },
  { value: 'BPOST_ENVOYE', label: 'bpost envoyé' },
  { value: 'PROCEDURE_JUDICIAIRE', label: 'Procédure judiciaire' },
  { value: 'PAYE', label: 'Payé' },
  { value: 'ABANDONNE', label: 'Abandonné' },
]

const DELAY_OPTIONS = [
  { value: '', label: 'Tous les retards' },
  { value: 'lt30', label: '< 30 jours' },
  { value: 'lt60', label: '30-60 jours' },
  { value: 'lt90', label: '60-90 jours' },
  { value: 'gt90', label: '> 90 jours' },
]

const AMOUNT_OPTIONS = [
  { value: '', label: 'Tous les montants' },
  { value: 'lt1000', label: '< 1 000 €' },
  { value: '1000-5000', label: '1 000 - 5 000 €' },
  { value: '5000-20000', label: '5 000 - 20 000 €' },
  { value: 'gt20000', label: '> 20 000 €' },
]

export default function DossiersClient({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [data, setData] = useState<DossiersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    delayCategory: '',
    amountRange: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    page: 1,
    limit: 20,
  })

  const fetchDossiers = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        companyId,
        ...Object.fromEntries(
          Object.entries(filters).map(([k, v]) => [k, String(v)])
        ),
      })
      const res = await fetch(`/api/dossiers?${params}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [companyId, filters])

  useEffect(() => {
    fetchDossiers()
  }, [fetchDossiers])

  function handleSort(col: string) {
    setFilters(f => ({
      ...f,
      sortBy: col,
      sortOrder: f.sortBy === col && f.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }

  function SortIcon({ col }: { col: string }) {
    if (filters.sortBy !== col) return <ChevronUp size={14} className="text-slate-300" />
    return filters.sortOrder === 'asc'
      ? <ChevronUp size={14} className="text-blue-500" />
      : <ChevronDown size={14} className="text-blue-500" />
  }

  async function exportCSV() {
    const params = new URLSearchParams({ companyId, format: 'csv', ...Object.fromEntries(Object.entries(filters).map(([k, v]) => [k, String(v)])) })
    const res = await fetch(`/api/dossiers/export?${params}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dossiers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const totalPages = data ? Math.ceil(data.total / filters.limit) : 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dossiers</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download size={16} />
            Exporter
          </Button>
          <Button size="sm" onClick={() => setShowNewModal(true)}>
            <Plus size={16} />
            Nouveau dossier
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher (débiteur, numéro, facture...)"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={filters.delayCategory}
            onChange={e => setFilters(f => ({ ...f, delayCategory: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {DELAY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={filters.amountRange}
            onChange={e => setFilters(f => ({ ...f, amountRange: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {AMOUNT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </Card>

      {/* Summary Bar */}
      {data && (
        <div className="flex flex-wrap gap-4 px-1">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{data.total}</span> dossier{data.total !== 1 ? 's' : ''}
          </div>
          <div className="text-sm text-slate-600">
            Total filtré: <span className="font-semibold text-slate-800">{formatCurrency(data.summary.totalAmount)}</span>
          </div>
          <div className="text-sm text-slate-600">
            Retard moyen: <span className="font-semibold text-slate-800">{Math.round(data.summary.avgDelay)}j</span>
          </div>
          <div className="text-sm text-slate-600">
            Actions requises: <span className="font-semibold text-red-600">{data.summary.actionRequired}</span>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  { key: 'numero', label: 'N°' },
                  { key: 'debtorName', label: 'Débiteur' },
                  { key: 'originalAmount', label: 'Montant' },
                  { key: 'dueDate', label: 'Échéance' },
                  { key: 'delay', label: 'Retard' },
                  { key: 'status', label: 'Statut' },
                  { key: 'updatedAt', label: 'Mise à jour' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== 'delay' && handleSort(col.key)}
                    className="px-4 py-3 text-left font-medium text-slate-600 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.key !== 'delay' && <SortIcon col={col.key} />}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Chargement...
                  </td>
                </tr>
              ) : data?.dossiers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Aucun dossier trouvé
                  </td>
                </tr>
              ) : (
                data?.dossiers.map(d => {
                  const daysOverdue = getDaysOverdue(new Date(d.dueDate))
                  const remaining = Number(d.originalAmount) - Number(d.paidAmount)
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.numero}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{d.debtorName}</div>
                        {d.invoiceNumber && (
                          <div className="text-xs text-slate-400">Fact. {d.invoiceNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {formatCurrency(remaining)}
                        {Number(d.paidAmount) > 0 && (
                          <div className="text-xs text-green-600">
                            ({formatCurrency(Number(d.paidAmount))} payé)
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatDate(new Date(d.dueDate))}
                      </td>
                      <td className="px-4 py-3">
                        {d.status !== 'PAYE' && daysOverdue > 0 ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getDelayBadgeColor(daysOverdue)}`}>
                            {daysOverdue}j
                          </span>
                        ) : (
                          <span className="text-xs text-green-600">À jour</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(d.status)}`}>
                          {getStatusLabel(d.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(new Date(d.updatedAt))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dossiers/${d.id}`}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Page {filters.page} sur {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
                disabled={filters.page === 1}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, page: Math.min(totalPages, f.page + 1) }))}
                disabled={filters.page === totalPages}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {showNewModal && (
        <NouveauDossierModal
          companyId={companyId}
          onClose={() => setShowNewModal(false)}
          onCreated={(id) => {
            setShowNewModal(false)
            router.push(`/dossiers/${id}`)
          }}
        />
      )}
    </div>
  )
}
