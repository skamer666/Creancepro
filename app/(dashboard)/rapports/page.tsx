import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

export default async function RapportsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Rapports</h1>
      <Card>
        <CardContent className="py-16 text-center">
          <TrendingUp size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-600">Rapports avancés</h2>
          <p className="text-slate-400 text-sm mt-2">
            Les rapports détaillés seront disponibles dans la prochaine version.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
