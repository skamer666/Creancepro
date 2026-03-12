import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DossierDetailClient from './dossier-detail-client'

export default async function DossierDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const dossier = await prisma.dossier.findFirst({
    where: {
      id: params.id,
      company: { userId: session.user.id },
    },
    include: {
      company: true,
      actions: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!dossier) notFound()

  return <DossierDetailClient dossier={JSON.parse(JSON.stringify(dossier))} />
}
