import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, getDaysOverdue, getStatusLabel, getStatusColor } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Euro,
} from 'lucide-react'
import Link from 'next/link'
import { differenceInDays } from 'date-fns'

async function getDashboardData(userId: string) {
  const company = await prisma.company.findFirst({ where: { userId } })
  if (!company) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [dossiers, recentDossiers] = await Promise.all([
    prisma.dossier.findMany({
      where: { companyId: company.id, status: { not: 'ABANDONNE' } },
      select: {
        id: true,
        numero: true,
        status: true,
        debtorName: true,
        originalAmount: true,
        paidAmount: true,
        dueDate: true,
        paidAt: true,
        updatedAt: true,
      },
    }),
    prisma.dossier.findMany({
      where: { companyId: company.id },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        numero: true,
        status: true,
        debtorName: true,
        originalAmount: true,
        dueDate: true,
        updatedAt: true,
      },
    }),
  ])

  const totalOutstanding = dossiers
    .filter(d => d.status !== 'PAYE')
    .reduce((sum, d) => sum + (Number(d.originalAmount) - Number(d.paidAmount)), 0)

  const recoveredThisMonth = dossiers
    .filter(d => d.status === 'PAYE' && d.paidAt && d.paidAt >= startOfMonth)
    .reduce((sum, d) => sum + Number(d.originalAmount), 0)

  const overdueGt60 = dossiers.filter(d => {
    const days = differenceInDays(now, new Date(d.dueDate))
    return days > 60 && d.status !== 'PAYE'
  }).length

  const paid = dossiers.filter(d => d.status === 'PAYE').length
  const successRate = dossiers.length > 0 ? (paid / dossiers.length) * 100 : 0

  const urgentActions = dossiers
    .filter(d => {
      const days = differenceInDays(now, new Date(d.dueDate))
      return days > 30 && d.status !== 'PAYE' && d.status !== 'PROCEDURE_JUDICIAIRE'
    })
    .sort((a, b) => differenceInDays(now, new Date(b.dueDate)) - differenceInDays(now, new Date(a.dueDate)))
    .slice(0, 5)

  return {
    kpis: {
      totalOutstanding,
      recoveredThisMonth,
      overdueGt60,
      successRate: Math.round(successRate),
      dossierCount: dossiers.length,
    },
    recentDossiers,
    urgentActions,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const data = await getDashboardData(session.user.id)

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700">Configuration requise</h2>
          <p className="text-slate-500 mt-2">Veuillez configurer votre entreprise dans les paramètres.</p>
          <Link href="/parametres" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">
            Configurer
          </Link>
        </div>
      </div>
    )
  }

  const { kpis, recentDossiers, urgentActions } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
        <Link
          href="/dossiers/nouveau"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
        >
          + Nouveau dossier
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total en cours</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {formatCurrency(kpis.totalOutstanding)}
                </p>
                <p className="text-xs text-slate-400 mt-1">{kpis.dossierCount} dossiers actifs</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Euro size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Récupéré ce mois</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(kpis.recoveredThisMonth)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Paiements reçus</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Retard &gt;60 jours</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{kpis.overdueGt60}</p>
                <p className="text-xs text-slate-400 mt-1">Dossiers critiques</p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Taux de succès</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{kpis.successRate}%</p>
                <p className="text-xs text-slate-400 mt-1">Dossiers résolus</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Dossiers */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dossiers récents</CardTitle>
                <Link href="/dossiers" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  Voir tout <ArrowRight size={14} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {recentDossiers.length === 0 ? (
                  <div className="px-6 py-8 text-center text-slate-400">
                    Aucun dossier pour l&apos;instant
                  </div>
                ) : (
                  recentDossiers.map(d => {
                    const daysOverdue = getDaysOverdue(d.dueDate)
                    return (
                      <Link
                        key={d.id}
                        href={`/dossiers/${d.id}`}
                        className="flex items-center px-6 py-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-slate-800 truncate">
                              {d.debtorName}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(d.status)}`}>
                              {getStatusLabel(d.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-slate-400">{d.numero}</span>
                            {daysOverdue > 0 && d.status !== 'PAYE' && (
                              <span className="text-xs text-red-500 flex items-center gap-1">
                                <Clock size={10} />
                                {daysOverdue}j de retard
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-semibold text-slate-700">
                            {formatCurrency(Number(d.originalAmount))}
                          </div>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" />
                Actions urgentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {urgentActions.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Aucune action urgente</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {urgentActions.map(d => {
                    const daysOverdue = getDaysOverdue(d.dueDate)
                    const nextAction = d.status === 'NOUVEAU' ? 'Envoyer rappel 1'
                      : d.status === 'RAPPEL_1' ? 'Envoyer rappel 2'
                      : d.status === 'RAPPEL_2' ? 'Rédiger MED'
                      : 'Procédure judiciaire'

                    return (
                      <Link
                        key={d.id}
                        href={`/dossiers/${d.id}`}
                        className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{d.debtorName}</p>
                            <p className="text-xs text-orange-600 font-medium mt-0.5">{nextAction}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {formatCurrency(Number(d.originalAmount))} · {daysOverdue}j retard
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legal Timeline */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Processus légal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { step: '1', label: 'Rappel amiable 1', color: 'bg-yellow-400', delay: 'J+14' },
                  { step: '2', label: 'Rappel amiable 2', color: 'bg-orange-400', delay: 'J+30' },
                  { step: '3', label: 'Mise en demeure', color: 'bg-red-400', delay: 'J+45' },
                  { step: '4', label: 'Procédure judiciaire', color: 'bg-red-700', delay: 'J+60+' },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className={`w-7 h-7 ${item.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 font-medium">{item.label}</p>
                    </div>
                    <span className="text-xs text-slate-400">{item.delay}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
