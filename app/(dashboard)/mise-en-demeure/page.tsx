import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default async function MisesEnDemeurePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const company = await prisma.company.findFirst({ where: { userId: session.user.id } })

  const dossiers = company ? await prisma.dossier.findMany({
    where: {
      companyId: company.id,
      status: { in: ['RAPPEL_2', 'MISE_EN_DEMEURE', 'BPOST_ENVOYE'] },
    },
    orderBy: { updatedAt: 'desc' },
    include: { documents: { where: { type: 'MISE_EN_DEMEURE' } } },
  }) : []

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Mises en demeure</h1>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-medium text-slate-600">Dossier</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Débiteur</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Montant</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Documents</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dossiers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                    Aucune mise en demeure en cours
                  </td>
                </tr>
              ) : (
                dossiers.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.numero}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{d.debtorName}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(Number(d.originalAmount))}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(d.status)}`}>
                        {getStatusLabel(d.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {d.documents.length} document{d.documents.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/mise-en-demeure/${d.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium mr-3"
                      >
                        Rédiger MED
                      </Link>
                      <Link
                        href={`/dossiers/${d.id}`}
                        className="text-slate-500 hover:underline text-xs"
                      >
                        Dossier
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
