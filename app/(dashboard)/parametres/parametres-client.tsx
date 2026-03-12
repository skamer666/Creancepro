'use client'

import { useState } from 'react'
import { Building, CreditCard, Bell, Mail, Shield, ChevronRight, Check, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Company {
  id: string
  name: string
  siret: string | null
  tva: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  iban: string | null
  bic: string | null
  bpostApiKey: string | null
  bpostAccountId: string | null
}

interface Subscription {
  plan: string
  status: string
  currentPeriodEnd: string | null
}

interface Props {
  company: Company | null
  subscription: Subscription | null
  userId: string
}

const TABS = [
  { id: 'company', label: 'Entreprise', icon: Building },
  { id: 'bpost', label: 'bpost API', icon: Mail },
  { id: 'subscription', label: 'Abonnement', icon: CreditCard },
]

export default function ParametresClient({ company, subscription, userId }: Props) {
  const [activeTab, setActiveTab] = useState('company')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<Partial<Company>>(company || {})

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  async function handleStripePortal() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  async function handleStripeCheckout(priceId: string) {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  const planBadge = {
    FREE: { label: 'Gratuit', color: 'bg-gray-100 text-gray-700' },
    STARTER: { label: 'Starter', color: 'bg-blue-100 text-blue-700' },
    PRO: { label: 'Pro', color: 'bg-purple-100 text-purple-700' },
    ENTERPRISE: { label: 'Enterprise', color: 'bg-orange-100 text-orange-700' },
  }

  const currentPlan = subscription?.plan || 'FREE'
  const badge = planBadge[currentPlan as keyof typeof planBadge] || planBadge.FREE

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Paramètres</h1>

      <div className="flex gap-6">
        {/* Tabs sidebar */}
        <div className="w-56 shrink-0">
          <div className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {activeTab === tab.id && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'company' && (
            <Card>
              <CardHeader>
                <CardTitle>Informations de l&apos;entreprise</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveCompany} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm text-slate-600 mb-1">Raison sociale *</label>
                      <input name="name" required value={form.name || ''} onChange={handleChange} className={inputClass} placeholder="Ma Société SPRL" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">N° TVA</label>
                      <input name="tva" value={form.tva || ''} onChange={handleChange} className={inputClass} placeholder="BE0123456789" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">N° BCE/KBO</label>
                      <input name="siret" value={form.siret || ''} onChange={handleChange} className={inputClass} placeholder="0123.456.789" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Email</label>
                      <input type="email" name="email" value={form.email || ''} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Téléphone</label>
                      <input name="phone" value={form.phone || ''} onChange={handleChange} className={inputClass} placeholder="+32 2 123 45 67" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-slate-600 mb-1">Adresse</label>
                      <input name="address" value={form.address || ''} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Ville</label>
                      <input name="city" value={form.city || ''} onChange={handleChange} className={inputClass} placeholder="Bruxelles" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Code postal</label>
                      <input name="postalCode" value={form.postalCode || ''} onChange={handleChange} className={inputClass} placeholder="1000" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">IBAN</label>
                      <input name="iban" value={form.iban || ''} onChange={handleChange} className={inputClass} placeholder="BE68 5390 0754 7034" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">BIC/SWIFT</label>
                      <input name="bic" value={form.bic || ''} onChange={handleChange} className={inputClass} placeholder="TRIOBEBB" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button type="submit" loading={loading}>
                      Enregistrer
                    </Button>
                    {saved && (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <Check size={16} />
                        Sauvegardé
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'bpost' && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration bpost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
                  <p className="text-sm text-blue-800">
                    <strong>bpost eBox API</strong> — Connectez votre compte bpost pour envoyer les mises en demeure
                    par courrier recommandé directement depuis CréancePro.
                  </p>
                </div>
                <form onSubmit={saveCompany} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Clé API bpost</label>
                    <input
                      type="password"
                      name="bpostApiKey"
                      value={form.bpostApiKey || ''}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">ID Compte expéditeur</label>
                    <input
                      name="bpostAccountId"
                      value={form.bpostAccountId || ''}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="account-12345"
                    />
                  </div>
                  <Button type="submit" loading={loading}>Enregistrer</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-4">
              {/* Current plan */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Plan actuel</CardTitle>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING' ? (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600">
                        Statut: <span className="font-medium text-green-600">Actif</span>
                      </p>
                      {subscription.currentPeriodEnd && (
                        <p className="text-sm text-slate-600">
                          Renouvellement: <span className="font-medium">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-BE')}
                          </span>
                        </p>
                      )}
                      <Button variant="outline" onClick={handleStripePortal}>
                        Gérer l&apos;abonnement
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Aucun abonnement actif. Choisissez un plan ci-dessous.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Plans */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: 'Starter',
                    price: '29',
                    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || 'price_starter',
                    features: ['50 dossiers actifs', 'Mises en demeure PDF', 'Export CSV', 'Support email'],
                    color: 'border-blue-200',
                    btnVariant: 'primary' as const,
                  },
                  {
                    name: 'Pro',
                    price: '79',
                    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_pro',
                    features: ['Dossiers illimités', 'Envoi bpost intégré', 'Rappels automatiques', 'API access', 'Support prioritaire'],
                    color: 'border-purple-300 bg-purple-50',
                    btnVariant: 'primary' as const,
                    popular: true,
                  },
                ].map(plan => (
                  <div key={plan.name} className={`rounded-xl border-2 p-5 ${plan.color}`}>
                    {plan.popular && (
                      <div className="mb-3">
                        <span className="bg-purple-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                          <Zap size={10} className="inline mr-1" />
                          Populaire
                        </span>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                    <div className="mt-1 mb-4">
                      <span className="text-3xl font-bold text-slate-900">{plan.price}€</span>
                      <span className="text-slate-400 text-sm">/mois</span>
                    </div>
                    <ul className="space-y-2 mb-5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                          <Check size={14} className="text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.btnVariant}
                      className="w-full"
                      onClick={() => handleStripeCheckout(plan.priceId)}
                      disabled={currentPlan === plan.name.toUpperCase()}
                    >
                      {currentPlan === plan.name.toUpperCase() ? 'Plan actuel' : `Choisir ${plan.name}`}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
