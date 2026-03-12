'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Eye, Download, Save, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate, calculateLegalInterest } from '@/lib/utils'
import { getCurrentLegalRate, getRateForDate, B2B_FLAT_FEE, getB2CMaxFee, getB2CMaxInterest } from '@/lib/legal-rates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { differenceInDays } from 'date-fns'

interface DossierWithCompany {
  id: string
  numero: string
  status: string
  debtorType: string
  debtorName: string
  debtorEmail: string | null
  debtorAddress: string | null
  debtorCity: string | null
  debtorPostalCode: string | null
  debtorVat: string | null
  invoiceNumber: string | null
  invoiceDate: string | null
  dueDate: string
  originalAmount: number
  paidAmount: number
  description: string | null
  company: {
    id: string
    name: string
    address: string | null
    city: string | null
    postalCode: string | null
    tva: string | null
    email: string | null
    phone: string | null
  }
}

export default function MiseEnDemeureEditor({ dossier }: { dossier: DossierWithCompany }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const remaining = Number(dossier.originalAmount) - Number(dossier.paidAmount)
  const rate = getCurrentLegalRate()
  const interestStart = new Date(dossier.dueDate)
  const legalInterest = calculateLegalInterest(remaining, rate, interestStart)

  const isB2B = dossier.debtorType === 'B2B'
  const flatFee = isB2B ? B2B_FLAT_FEE : Math.min(getB2CMaxFee(remaining), 40)
  const cappedInterest = isB2B
    ? legalInterest
    : Math.min(legalInterest, getB2CMaxInterest(remaining))

  const totalClaim = remaining + cappedInterest + flatFee
  const daysOverdue = differenceInDays(new Date(), new Date(dossier.dueDate))

  const today = new Date()
  const deadline = new Date(today)
  deadline.setDate(deadline.getDate() + 15) // 15-day payment deadline

  const [fields, setFields] = useState({
    recipientName: dossier.debtorName,
    recipientAddress: dossier.debtorAddress || '',
    recipientCity: `${dossier.debtorPostalCode || ''} ${dossier.debtorCity || ''}`.trim(),
    invoiceRef: dossier.invoiceNumber || '',
    invoiceDate: dossier.invoiceDate ? dossier.invoiceDate.split('T')[0] : '',
    dueDate: dossier.dueDate.split('T')[0],
    principalAmount: remaining.toString(),
    interestAmount: cappedInterest.toFixed(2),
    flatFeeAmount: flatFee.toString(),
    totalAmount: totalClaim.toFixed(2),
    paymentDeadline: deadline.toISOString().split('T')[0],
    language: 'fr',
  })

  useEffect(() => {
    setFields(f => ({
      ...f,
      interestAmount: cappedInterest.toFixed(2),
      totalAmount: (parseFloat(f.principalAmount) + cappedInterest + flatFee).toFixed(2),
    }))
  }, [cappedInterest, flatFee])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFields(f => {
      const updated = { ...f, [name]: value }
      if (name === 'principalAmount' || name === 'interestAmount' || name === 'flatFeeAmount') {
        const p = parseFloat(updated.principalAmount) || 0
        const i = parseFloat(updated.interestAmount) || 0
        const ff = parseFloat(updated.flatFeeAmount) || 0
        updated.totalAmount = (p + i + ff).toFixed(2)
      }
      return updated
    })
  }

  async function generatePDF() {
    setLoading('pdf')
    try {
      const res = await fetch(`/api/dossiers/${dossier.id}/med`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `MED-${dossier.numero}.pdf`
        a.click()
      }
    } finally {
      setLoading(null)
    }
  }

  async function sendViaBpost() {
    setLoading('bpost')
    try {
      const res = await fetch(`/api/dossiers/${dossier.id}/bpost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Envoyé via bpost! N° suivi: ${data.trackingNumber}`)
        router.push(`/dossiers/${dossier.id}`)
      }
    } finally {
      setLoading(null)
    }
  }

  const medText = `${dossier.company.name}
${dossier.company.address || ''}
${dossier.company.postalCode || ''} ${dossier.company.city || ''}
${dossier.company.tva ? `TVA: ${dossier.company.tva}` : ''}

${formatDate(today)}

**MISE EN DEMEURE**
Envoyée par recommandé avec accusé de réception

À:
${fields.recipientName}
${fields.recipientAddress}
${fields.recipientCity}
${dossier.debtorVat ? `TVA: ${dossier.debtorVat}` : ''}

---

Madame, Monsieur,

Par la présente, nous vous mettons en demeure de nous payer la somme de **${formatCurrency(parseFloat(fields.totalAmount))}** se décomposant comme suit:

• Principal impayé (facture ${fields.invoiceRef || 'N/A'} du ${fields.invoiceDate ? formatDate(new Date(fields.invoiceDate)) : 'N/A'}):
  **${formatCurrency(parseFloat(fields.principalAmount))}**

• Intérêts légaux (${(rate * 100).toFixed(1)}% depuis le ${formatDate(new Date(fields.dueDate))} — ${daysOverdue} jours):
  **+${formatCurrency(parseFloat(fields.interestAmount))}**

• Indemnité forfaitaire de recouvrement (${isB2B ? 'art. 6 loi du 2 août 2002' : 'loi du 4 mai 2023'}):
  **+${formatCurrency(parseFloat(fields.flatFeeAmount))}**

**TOTAL RÉCLAMÉ: ${formatCurrency(parseFloat(fields.totalAmount))}**

Nous vous demandons de bien vouloir nous verser cette somme au plus tard le **${formatDate(new Date(fields.paymentDeadline))}** sur notre compte bancaire.

À défaut de paiement dans ce délai, nous nous réservons le droit d'initier une procédure judiciaire à vos frais.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

${dossier.company.name}`

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link href={`/dossiers/${dossier.id}`} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">Mise en demeure</h1>
          <p className="text-slate-400 text-sm">{dossier.numero} — {dossier.debtorName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye size={16} />
            {showPreview ? 'Masquer aperçu' : 'Aperçu'}
          </Button>
          <Button variant="secondary" size="sm" onClick={generatePDF} loading={loading === 'pdf'}>
            <Download size={16} />
            Télécharger PDF
          </Button>
          <Button size="sm" onClick={sendViaBpost} loading={loading === 'bpost'}>
            <Send size={16} />
            Envoyer via bpost
          </Button>
        </div>
      </div>

      {/* Legal amount summary */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-800 mb-2">Récapitulatif légal</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-orange-600">Principal</p>
                  <p className="font-bold text-orange-900">{formatCurrency(remaining)}</p>
                </div>
                <div>
                  <p className="text-orange-600">Intérêts ({(rate * 100).toFixed(1)}%)</p>
                  <p className="font-bold text-orange-900">+{formatCurrency(cappedInterest)}</p>
                </div>
                <div>
                  <p className="text-orange-600">Indemnité forfaitaire</p>
                  <p className="font-bold text-orange-900">+{formatCurrency(flatFee)}</p>
                  <p className="text-xs text-orange-600">{isB2B ? 'Loi 02/08/2002' : 'Loi 04/05/2023'}</p>
                </div>
                <div>
                  <p className="text-orange-600">Total réclamable</p>
                  <p className="font-bold text-xl text-orange-900">{formatCurrency(totalClaim)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Editor */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Destinataire</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Nom / Raison sociale</label>
                <input name="recipientName" value={fields.recipientName} onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Adresse</label>
                <input name="recipientAddress" value={fields.recipientAddress} onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Ville</label>
                <input name="recipientCity" value={fields.recipientCity} onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Montants</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'principalAmount', label: 'Principal (€)' },
                { name: 'interestAmount', label: 'Intérêts légaux (€)' },
                { name: 'flatFeeAmount', label: 'Indemnité forfaitaire (€)' },
                { name: 'totalAmount', label: 'Total réclamé (€)' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm text-slate-600 mb-1">{f.label}</label>
                  <input type="number" step="0.01" name={f.name} value={(fields as any)[f.name]} onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${f.name === 'totalAmount' ? 'bg-slate-50 font-semibold' : 'border-slate-200'}`}
                    readOnly={f.name === 'totalAmount'}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Délai de paiement</CardTitle></CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Payer avant le</label>
                <input type="date" name="paymentDeadline" value={fields.paymentDeadline} onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        {showPreview && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Eye size={16} />Aperçu</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-white border border-slate-200 rounded-lg p-6 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-700 max-h-[600px] overflow-y-auto">
                {medText}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
