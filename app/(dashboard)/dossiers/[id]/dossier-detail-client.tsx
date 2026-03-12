'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, FileText, Send, CheckCircle, AlertTriangle, Clock,
  Download, Mail, Phone, MapPin, Building, Euro, Calendar
} from 'lucide-react'
import { formatCurrency, formatDate, getDaysOverdue, getStatusLabel, getStatusColor, calculateLegalInterest } from '@/lib/utils'
import { getCurrentLegalRate, B2B_FLAT_FEE } from '@/lib/legal-rates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Action {
  id: string
  type: string
  title: string
  description: string | null
  amount: number | null
  performedBy: string | null
  createdAt: string
}

interface Document {
  id: string
  type: string
  title: string
  fileUrl: string | null
  bpostTracking: string | null
  sentAt: string | null
  createdAt: string
}

interface DossierFull {
  id: string
  numero: string
  status: string
  debtorType: string
  debtorName: string
  debtorEmail: string | null
  debtorPhone: string | null
  debtorAddress: string | null
  debtorCity: string | null
  debtorPostalCode: string | null
  debtorVat: string | null
  invoiceNumber: string | null
  invoiceDate: string | null
  dueDate: string
  originalAmount: number
  paidAmount: number
  currency: string
  description: string | null
  legalInterestRate: number | null
  interestStartDate: string | null
  flatFee: number
  notes: string | null
  internalRef: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
  company: {
    id: string
    name: string
    email: string | null
  }
  actions: Action[]
  documents: Document[]
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  CREATION: <FileText size={14} />,
  RAPPEL_1_ENVOYE: <Mail size={14} />,
  RAPPEL_2_ENVOYE: <Mail size={14} />,
  MED_REDIGEE: <FileText size={14} />,
  MED_ENVOYEE_BPOST: <Send size={14} />,
  MED_ENVOYEE_EMAIL: <Mail size={14} />,
  PAIEMENT_COMPLET: <CheckCircle size={14} />,
  PAIEMENT_PARTIEL: <Euro size={14} />,
  NOTE_INTERNE: <FileText size={14} />,
  STATUT_CHANGE: <AlertTriangle size={14} />,
}

export default function DossierDetailClient({ dossier }: { dossier: DossierFull }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [showAddNote, setShowAddNote] = useState(false)

  const daysOverdue = getDaysOverdue(new Date(dossier.dueDate))
  const remaining = Number(dossier.originalAmount) - Number(dossier.paidAmount)
  const rate = Number(dossier.legalInterestRate) || getCurrentLegalRate()
  const interestStart = dossier.interestStartDate
    ? new Date(dossier.interestStartDate)
    : new Date(dossier.dueDate)
  const legalInterest = dossier.status !== 'PAYE'
    ? calculateLegalInterest(remaining, rate, interestStart)
    : 0
  const totalWithInterest = remaining + legalInterest + (dossier.debtorType === 'B2B' ? B2B_FLAT_FEE : 0)

  async function doAction(action: string, extra?: Record<string, unknown>) {
    setLoading(action)
    try {
      const res = await fetch(`/api/dossiers/${dossier.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      if (res.ok) {
        router.refresh()
        window.location.reload()
      }
    } finally {
      setLoading(null)
    }
  }

  async function addNote() {
    if (!note.trim()) return
    await doAction('NOTE', { note })
    setNote('')
    setShowAddNote(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dossiers" className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{dossier.debtorName}</h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dossier.status)}`}>
              {getStatusLabel(dossier.status)}
            </span>
            {daysOverdue > 0 && dossier.status !== 'PAYE' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm">
                <Clock size={14} />
                {daysOverdue} jours de retard
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-0.5">{dossier.numero}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-5">
          {/* Action buttons */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-2">
                {dossier.status === 'NOUVEAU' && (
                  <Button size="sm" onClick={() => doAction('RAPPEL_1')} loading={loading === 'RAPPEL_1'}>
                    <Mail size={15} /> Envoyer rappel 1
                  </Button>
                )}
                {dossier.status === 'RAPPEL_1' && (
                  <Button size="sm" onClick={() => doAction('RAPPEL_2')} loading={loading === 'RAPPEL_2'}>
                    <Mail size={15} /> Envoyer rappel 2
                  </Button>
                )}
                {(dossier.status === 'RAPPEL_2' || dossier.status === 'RAPPEL_1') && (
                  <Link href={`/mise-en-demeure/${dossier.id}`}>
                    <Button size="sm" variant="danger">
                      <FileText size={15} /> Rédiger mise en demeure
                    </Button>
                  </Link>
                )}
                {dossier.status === 'MISE_EN_DEMEURE' && (
                  <Button size="sm" onClick={() => doAction('BPOST')} loading={loading === 'BPOST'}>
                    <Send size={15} /> Envoyer via bpost
                  </Button>
                )}
                {dossier.status !== 'PAYE' && dossier.status !== 'ABANDONNE' && (
                  <Button size="sm" variant="secondary" onClick={() => doAction('PAYE')} loading={loading === 'PAYE'}>
                    <CheckCircle size={15} /> Marquer comme payé
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setShowAddNote(!showAddNote)}>
                  + Note interne
                </Button>
              </div>
              {showAddNote && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Ajouter une note interne..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button size="sm" onClick={addNote}>Enregistrer</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des actions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {dossier.actions.length === 0 ? (
                <p className="px-6 py-8 text-center text-slate-400 text-sm">Aucune action enregistrée</p>
              ) : (
                <div className="relative px-6 py-4">
                  <div className="absolute left-10 top-0 bottom-0 w-px bg-slate-200" />
                  <div className="space-y-4">
                    {dossier.actions.map((action) => (
                      <div key={action.id} className="relative flex gap-4">
                        <div className="relative z-10 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                          {ACTION_ICONS[action.type] || <FileText size={14} />}
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-lg px-4 py-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-slate-800">{action.title}</span>
                            <span className="text-xs text-slate-400">{formatDate(new Date(action.createdAt))}</span>
                          </div>
                          {action.description && (
                            <p className="text-xs text-slate-500 mt-1">{action.description}</p>
                          )}
                          {action.amount && (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              {formatCurrency(Number(action.amount))}
                            </p>
                          )}
                          {action.performedBy && (
                            <p className="text-xs text-slate-400 mt-1">Par {action.performedBy}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          {dossier.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {dossier.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{doc.title}</p>
                          <p className="text-xs text-slate-400">{formatDate(new Date(doc.createdAt))}</p>
                          {doc.bpostTracking && (
                            <p className="text-xs text-purple-600">Track: {doc.bpostTracking}</p>
                          )}
                        </div>
                      </div>
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} download className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Download size={16} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Amounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Euro size={16} />Montants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Principal</span>
                <span className="font-semibold">{formatCurrency(Number(dossier.originalAmount))}</span>
              </div>
              {Number(dossier.paidAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Déjà payé</span>
                  <span className="font-semibold text-green-600">-{formatCurrency(Number(dossier.paidAmount))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Restant dû</span>
                <span className="font-semibold text-red-600">{formatCurrency(remaining)}</span>
              </div>
              {dossier.status !== 'PAYE' && (
                <>
                  <hr className="border-slate-100" />
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Intérêts légaux ({(rate * 100).toFixed(1)}%)
                    </span>
                    <span className="font-semibold text-orange-600">+{formatCurrency(legalInterest)}</span>
                  </div>
                  {dossier.debtorType === 'B2B' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Indemnité forfaitaire</span>
                      <span className="font-semibold text-orange-600">+{formatCurrency(B2B_FLAT_FEE)}</span>
                    </div>
                  )}
                  <hr className="border-slate-200" />
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-800">Total réclamable</span>
                    <span className="text-slate-900 text-base">{formatCurrency(totalWithInterest)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Debtor info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building size={16} />
                {dossier.debtorName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Badge variant={dossier.debtorType === 'B2B' ? 'info' : 'default'}>
                {dossier.debtorType}
              </Badge>
              {dossier.debtorVat && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building size={14} className="text-slate-400" />
                  {dossier.debtorVat}
                </div>
              )}
              {dossier.debtorEmail && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  <a href={`mailto:${dossier.debtorEmail}`} className="hover:underline">{dossier.debtorEmail}</a>
                </div>
              )}
              {dossier.debtorPhone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  {dossier.debtorPhone}
                </div>
              )}
              {dossier.debtorAddress && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin size={14} className="text-slate-400 mt-0.5" />
                  <div>
                    <div>{dossier.debtorAddress}</div>
                    <div>{dossier.debtorPostalCode} {dossier.debtorCity}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar size={16} />Facture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {dossier.invoiceNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">N° facture</span>
                  <span className="font-medium">{dossier.invoiceNumber}</span>
                </div>
              )}
              {dossier.invoiceDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium">{formatDate(new Date(dossier.invoiceDate))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Échéance</span>
                <span className={`font-medium ${daysOverdue > 0 && dossier.status !== 'PAYE' ? 'text-red-600' : ''}`}>
                  {formatDate(new Date(dossier.dueDate))}
                </span>
              </div>
              {dossier.internalRef && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Réf. interne</span>
                  <span className="font-medium">{dossier.internalRef}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
