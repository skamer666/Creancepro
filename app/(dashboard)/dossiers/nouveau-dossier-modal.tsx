'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface Props {
  companyId: string
  onClose: () => void
  onCreated: (id: string) => void
}

export default function NouveauDossierModal({ companyId, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    debtorName: '',
    debtorEmail: '',
    debtorPhone: '',
    debtorAddress: '',
    debtorCity: '',
    debtorPostalCode: '',
    debtorVat: '',
    debtorType: 'B2B',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    originalAmount: '',
    currency: 'EUR',
    description: '',
    internalRef: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, companyId, originalAmount: parseFloat(form.originalAmount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      onCreated(data.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <Modal isOpen onClose={onClose} title="Nouveau dossier" size="xl">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Débiteur */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Débiteur</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Nom / Raison sociale *</label>
              <input name="debtorName" required value={form.debtorName} onChange={handleChange} className={inputClass} placeholder="Société XYZ SPRL" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Type</label>
              <select name="debtorType" value={form.debtorType} onChange={handleChange} className={inputClass}>
                <option value="B2B">B2B (entreprise)</option>
                <option value="B2C">B2C (particulier)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">N° TVA (B2B)</label>
              <input name="debtorVat" value={form.debtorVat} onChange={handleChange} className={inputClass} placeholder="BE0123456789" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <input type="email" name="debtorEmail" value={form.debtorEmail} onChange={handleChange} className={inputClass} placeholder="contact@example.com" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Téléphone</label>
              <input name="debtorPhone" value={form.debtorPhone} onChange={handleChange} className={inputClass} placeholder="+32 2 123 45 67" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Adresse</label>
              <input name="debtorAddress" value={form.debtorAddress} onChange={handleChange} className={inputClass} placeholder="Rue de la Loi 1" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Ville</label>
              <input name="debtorCity" value={form.debtorCity} onChange={handleChange} className={inputClass} placeholder="Bruxelles" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Code postal</label>
              <input name="debtorPostalCode" value={form.debtorPostalCode} onChange={handleChange} className={inputClass} placeholder="1000" />
            </div>
          </div>
        </div>

        {/* Créance */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Créance</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">N° facture</label>
              <input name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange} className={inputClass} placeholder="FAC-2024-0001" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Date facture</label>
              <input type="date" name="invoiceDate" value={form.invoiceDate} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Date d'échéance *</label>
              <input type="date" name="dueDate" required value={form.dueDate} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Montant (€) *</label>
              <input type="number" step="0.01" min="0" name="originalAmount" required value={form.originalAmount} onChange={handleChange} className={inputClass} placeholder="1500.00" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={2} className={inputClass} placeholder="Prestations de services..." />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Référence interne</label>
              <input name="internalRef" value={form.internalRef} onChange={handleChange} className={inputClass} placeholder="PROJ-001" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={loading}>Créer le dossier</Button>
        </div>
      </form>
    </Modal>
  )
}
