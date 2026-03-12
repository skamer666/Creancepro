'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription')
      } else {
        router.push('/auth/login?registered=true')
      }
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Créer un compte</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            required
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Jean Dupont"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l&apos;entreprise</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))}
            required
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ma Société SPRL"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
            required
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="vous@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
          <input
            type="password"
            value={formData.password}
            onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
            required
            minLength={8}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Minimum 8 caractères"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Déjà un compte ?{' '}
        <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
